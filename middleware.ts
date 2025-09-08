import { DEFAULT_LOCALE, LOCALES } from '@/lib/optimizely/utils/language'
import { createUrl, withLeadingSlash } from '@/lib/utils'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import Negotiator from 'negotiator'

const COOKIE_NAME_LOCALE = '__LOCALE_NAME'
const HEADER_KEY_LOCALE = 'X-Locale'

/**
 * Determines whether the request path should bypass locale handling.
 *
 * This excludes static assets, API routes, known system paths (like /draft),
 * and any path containing a file extension.
 *
 * @param path - The request pathname (e.g. `/about`, `/api/user`, `/styles.css`)
 * @returns True if the path should be excluded from locale middleware
 */
function shouldExclude(path: string): boolean {
  return (
    path.startsWith('/static') ||
    path.includes('/api/') ||
    path.includes('.') || // e.g. .css, .js, .png
    path.startsWith('/draft') || // ✅ Prevent locale rewrite on draft preview routes
    path.startsWith('/preview') || // ✅ Prevent locale rewrite on preview API routes
    path.startsWith('/auth') // ✅ (Optional) Add other system routes you want to exclude
  )
}

/**
 * Parses the `Accept-Language` header to determine the user's preferred language.
 *
 * Supports fallback to base language codes (e.g. `en-GB` → `en`).
 *
 * @param request - The incoming Next.js request
 * @param locales - Supported locale codes (e.g. ['en', 'fr'])
 * @returns The preferred locale if matched, otherwise undefined
 */
function getBrowserLanguage(
  request: NextRequest,
  locales: string[]
): string | undefined {
  const acceptLang = request.headers.get('Accept-Language')
  if (!acceptLang) return undefined

  const preferred = new Negotiator({
    headers: { 'accept-language': acceptLang },
  }).languages()

  for (const lang of preferred) {
    if (locales.includes(lang)) return lang
    const base = lang.split('-')[0]
    if (locales.includes(base)) return base
  }

  return undefined
}

/**
 * Resolves the user's locale preference from cookie, browser, or fallback.
 *
 * Order of precedence:
 * 1. Locale stored in cookie
 * 2. Browser's Accept-Language header
 * 3. Default locale
 *
 * @param request - The incoming Next.js request
 * @param locales - Supported locale codes
 * @returns A valid locale string
 */
function getLocale(request: NextRequest, locales: string[]): string {
  const cookieLocale = request.cookies.get(COOKIE_NAME_LOCALE)?.value
  if (cookieLocale && locales.includes(cookieLocale)) return cookieLocale

  const browserLang = getBrowserLanguage(request, locales)
  if (browserLang && locales.includes(browserLang)) return browserLang

  return DEFAULT_LOCALE
}

/**
 * Updates the user's locale preference via cookie and response header.
 *
 * If a new locale is provided and differs from the current cookie, it sets a new one.
 * If no locale is provided, it clears the existing cookie and header.
 *
 * @param request - The incoming request
 * @param response - The outgoing response
 * @param locale - The locale to persist (optional)
 */
function updateLocaleCookies(
  request: NextRequest,
  response: NextResponse,
  locale?: string
): void {
  const current = request.cookies.get(COOKIE_NAME_LOCALE)?.value

  if (locale && locale !== current) {
    response.cookies.set(COOKIE_NAME_LOCALE, locale)
  } else if (!locale && current) {
    response.cookies.delete(COOKIE_NAME_LOCALE)
  }

  if (locale) {
    response.headers.set(HEADER_KEY_LOCALE, locale)
  } else {
    response.headers.delete(HEADER_KEY_LOCALE)
  }
}

/**
 * Middleware that enables locale-aware routing, redirects, and cookie persistence.
 *
 * Behaviour:
 * - If the request path includes a valid locale, it rewrites and stores the locale in a cookie.
 * - If no locale is present, it detects the preferred one and redirects or rewrites accordingly.
 *
 * @param request - The incoming Next.js request
 * @returns A `NextResponse` with applied rewrite, redirect, or pass-through
 */
export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname, searchParams } = request.nextUrl

  if (shouldExclude(pathname)) {
    return NextResponse.next()
  }

  const pathLocale = LOCALES.find(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  )

  if (pathLocale) {
    const pathWithoutLocale = pathname.replace(`/${pathLocale}`, '') || '/'
    const rewrittenPath = createUrl(
      `/${pathLocale}${withLeadingSlash(pathWithoutLocale)}`,
      searchParams
    )
    const response = NextResponse.rewrite(new URL(rewrittenPath, request.url))
    updateLocaleCookies(request, response, pathLocale)
    return response
  }

  const resolvedLocale = getLocale(request, LOCALES)
  const redirectedPath = createUrl(
    `/${resolvedLocale}${withLeadingSlash(pathname)}`,
    searchParams
  )

  const response =
    resolvedLocale === DEFAULT_LOCALE
      ? NextResponse.rewrite(new URL(redirectedPath, request.url))
      : NextResponse.redirect(new URL(redirectedPath, request.url))

  updateLocaleCookies(request, response, resolvedLocale)
  return response
}

/**
 * Middleware matcher configuration.
 *
 * Applies middleware to all routes **except**:
 * - API routes (`/api`)
 * - Next.js internals (`/_next/static`, `/_next/image`)
 * - Favicon files
 */
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon\\.(?:ico|png)).*)'],
}
