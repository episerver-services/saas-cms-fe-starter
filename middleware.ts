import { DEFAULT_LOCALE, LOCALES } from '@/lib/optimizely/utils/language'
import { createUrl, withLeadingSlash } from '@/lib/utils'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import Negotiator from 'negotiator'

const COOKIE_NAME_LOCALE = '__LOCALE_NAME'
const HEADER_KEY_LOCALE = 'X-Locale'

// Name of preview token header (as sent from CMS)
const HEADER_KEY_PREVIEW_TOKEN = 'x-preview-token'

// Expected token secret or validator function (from env)
const VALID_PREVIEW_TOKEN = process.env.OPTIMIZELY_PREVIEW_SECRET

/**
 * Determines whether the request path should bypass locale handling.
 */
function shouldExclude(path: string): boolean {
  return (
    path.startsWith('/static') ||
    path.includes('/api/') ||
    path.includes('.') ||
    path.startsWith('/draft') ||
    path.startsWith('/preview') ||
    path.startsWith('/auth')
  )
}

/**
 * Preview token validation.
 *
 * Ensures that requests to /draft or /preview routes include a valid token.
 */
function validatePreviewToken(request: NextRequest): boolean {
  const token =
    request.nextUrl.searchParams.get('token') ||
    request.headers.get(HEADER_KEY_PREVIEW_TOKEN)

  if (!token || !VALID_PREVIEW_TOKEN) return false
  return token === VALID_PREVIEW_TOKEN
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname, searchParams } = request.nextUrl

  // ✅ 1. Handle Preview Token Validation early
  if (pathname.startsWith('/draft') || pathname.startsWith('/preview')) {
    if (!validatePreviewToken(request)) {
      return new NextResponse('Unauthorized preview access', { status: 401 })
    }
    // Allow request to continue if token is valid
    return NextResponse.next()
  }

  // ✅ 2. Normal locale middleware behaviour
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

/** Locale helpers (unchanged) **/
function getBrowserLanguage(request: NextRequest, locales: string[]): string | undefined {
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

function getLocale(request: NextRequest, locales: string[]): string {
  const cookieLocale = request.cookies.get(COOKIE_NAME_LOCALE)?.value
  if (cookieLocale && locales.includes(cookieLocale)) return cookieLocale
  const browserLang = getBrowserLanguage(request, locales)
  if (browserLang && locales.includes(browserLang)) return browserLang
  return DEFAULT_LOCALE
}

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

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon\\.(?:ico|png)).*)'],
}