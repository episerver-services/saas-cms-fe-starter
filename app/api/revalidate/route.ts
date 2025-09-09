import { optimizely } from '@/lib/optimizely/fetch'
import { revalidatePath, revalidateTag } from 'next/cache'
import { type NextRequest, NextResponse } from 'next/server'
import crypto from 'node:crypto'

/**
 * Optimizely publish webhook handler (POST).
 *
 * Validates the request (HMAC header if configured, else query secret), extracts a `docId`,
 * resolves the content GUID, infers the public URL, and triggers revalidation for either
 * a page path or a cache tag (header/footer).
 *
 * @param request - The incoming webhook POST request (Next.js `NextRequest` or standard `Request` in tests).
 * @returns {Promise<NextResponse>} JSON indicating revalidation status or an error.
 * @throws If signature validation fails, the query secret is invalid, or the JSON body is malformed.
 */
export async function POST(
  request: NextRequest | Request
): Promise<NextResponse> {
  try {
    // If a signature header is present (and a shared key is configured), verify it.
    await verifySignatureIfPresent(request)

    // Fallback/legacy query secret check (kept for compatibility).
    validateWebhookSecret(request)

    const docId = await extractDocIdSafe(request)
    if (!docId || !docId.includes('Published')) {
      return NextResponse.json({ message: 'No action taken' })
    }

    const [guid, locale] = docId.split('_')
    const formattedGuid = guid.replaceAll('-', '')

    const content = await fetchContentByGuid(formattedGuid)
    const metadata = content?._metadata
    const urlData = hasUrlMetadata(metadata) ? metadata.url : undefined

    // Normalize the CMS URL to be relative to the site root
    const url =
      urlData?.type === 'SIMPLE'
        ? urlData?.default
        : urlData?.hierarchical?.replace(
            process.env.OPTIMIZELY_START_PAGE_URL ?? '',
            ''
          )

    if (!url) {
      return NextResponse.json({ message: 'Page Not Found' }, { status: 400 })
    }

    const urlWithLocale = normalizeUrl(url, locale)
    await handleRevalidation(urlWithLocale)

    return NextResponse.json({ revalidated: true, now: Date.now() })
  } catch (error) {
    return handleError(error)
  }
}

/* ------------------------- Auth & Parsing Helpers ------------------------- */

/**
 * Verifies the HMAC signature when both:
 *   - The request contains an `x-optimizely-signature` header (hex-encoded), and
 *   - `OPTIMIZELY_WEBHOOK_SECRET` is set.
 *
 * Uses HMAC-SHA256 and constant-time comparison. If either the header or secret
 * is missing, this function is a no-op (fallback to query secret applies).
 *
 * @param request - A Next.js `NextRequest` or standard `Request`.
 * @returns {Promise<void>} Resolves if the signature is valid or not required.
 * @throws {Error} If the signature is present but invalid (`"Invalid signature"`).
 */
async function verifySignatureIfPresent(request: Request | NextRequest) {
  const signature = request.headers.get('x-optimizely-signature')
  const key = process.env.OPTIMIZELY_WEBHOOK_SECRET
  if (!signature || !key) return

  const body = await request.clone().text()
  const expected = crypto.createHmac('sha256', key).update(body).digest('hex')

  // Constant-time compare
  const a = Buffer.from(signature, 'hex')
  const b = Buffer.from(expected, 'hex')
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw new Error('Invalid signature')
  }
}

/**
 * Validates the webhook's query-string secret.
 *
 * Reads `cg_webhook_secret` from the request URL and compares to
 * `OPTIMIZELY_REVALIDATE_SECRET`. Intended as a fallback/legacy check
 * when HMAC signatures are not used.
 *
 * @param request - A Next.js `NextRequest` or standard `Request`.
 * @returns {void}
 * @throws {Error} If the secret is missing or does not match (`"Invalid credentials"`).
 */
function validateWebhookSecret(request: NextRequest | Request): void {
  const secret = new URL(request.url).searchParams.get('cg_webhook_secret')
  const expected = process.env.OPTIMIZELY_REVALIDATE_SECRET
  if (secret !== expected) {
    throw new Error('Invalid credentials')
  }
}

/**
 * Parses the JSON body and extracts `data.docId` safely.
 *
 * Example `docId` format: `{GUID_WITHOUT_DASHES}_Published_en`
 * Only the `"Published"` case triggers page revalidation.
 *
 * @param req - A Next.js `NextRequest` or standard `Request`.
 * @returns {Promise<string>} The extracted `docId` or an empty string when not present.
 * @throws {Error} If the body is not valid JSON (`"Bad JSON"`).
 */
async function extractDocIdSafe(req: Request | NextRequest): Promise<string> {
  let json: unknown
  try {
    json = await req.json()
  } catch {
    throw new Error('Bad JSON')
  }
  const docId = (json as any)?.data?.docId
  return typeof docId === 'string' ? docId : ''
}

/* --------------------------- CMS Interaction ----------------------------- */

/**
 * Fetches a content item by GUID via the local Optimizely SDK.
 *
 * @param guid - The content GUID without dashes (format expected by the API).
 * @returns {Promise<any>} The first resolved content item.
 * @throws {Error} If no item is returned (`"Content not found"`).
 */
async function fetchContentByGuid(guid: string): Promise<any> {
  const { _Content } = await optimizely.GetContentByGuid({ guid })
  const item = _Content?.items?.[0]
  if (!item) {
    throw new Error('Content not found')
  }
  return item
}

/* ----------------------------- URL Utilities ----------------------------- */

/**
 * Normalizes a CMS URL and ensures a locale prefix.
 *
 * - Prepends a leading slash when missing.
 * - Strips a trailing slash.
 * - Ensures the path begins with `/${locale}` (idempotent).
 *
 * @param url - A CMS-provided relative URL (e.g., `/about` or `about/`).
 * @param locale - The locale to prefix (e.g., `"en"`).
 * @returns {string} A normalized locale-prefixed path (e.g., `/en/about`).
 */
function normalizeUrl(url: string, locale: string): string {
  let normalizedUrl = url.startsWith('/') ? url : `/${url}`
  if (normalizedUrl.endsWith('/')) {
    normalizedUrl = normalizedUrl.slice(0, -1)
  }
  return normalizedUrl.startsWith(`/${locale}`)
    ? normalizedUrl
    : `/${locale}${normalizedUrl}`
}

/**
 * Revalidates a cache tag or specific path.
 *
 * - If the URL path includes `"footer"`, revalidates the `optimizely-footer` tag.
 * - If the URL path includes `"header"`, revalidates the `optimizely-header` tag.
 * - Otherwise, revalidates the exact page path.
 *
 * @param urlWithLocale - A normalized, locale-prefixed path (e.g., `/en/about`).
 * @returns {Promise<void>}
 */
async function handleRevalidation(urlWithLocale: string): Promise<void> {
  const segs = urlWithLocale.split('/').filter(Boolean)
  if (segs.includes('footer')) {
    await revalidateTag('optimizely-footer')
  } else if (segs.includes('header')) {
    await revalidateTag('optimizely-header')
  } else {
    await revalidatePath(urlWithLocale)
  }
}

/* -------------------------------- Errors --------------------------------- */

/**
 * Maps known errors to structured JSON responses.
 *
 * Known messages:
 * - `"Invalid credentials"` → 401
 * - `"Invalid signature"` → 401
 * - `"Bad JSON"` → 400
 * - `"Content not found"` → 500
 * - Any other `Error` → 500
 *
 * @param error - Any thrown value during webhook processing.
 * @returns {NextResponse} A JSON response with `message` and HTTP status.
 */
function handleError(error: unknown): NextResponse {
  if (error instanceof Error) {
    if (error.message === 'Invalid credentials') {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      )
    }
    if (error.message === 'Invalid signature') {
      return NextResponse.json(
        { message: 'Invalid signature' },
        { status: 401 }
      )
    }
    if (error.message === 'Bad JSON') {
      return NextResponse.json({ message: 'Bad JSON' }, { status: 400 })
    }
    if (error.message === 'Content not found') {
      return NextResponse.json(
        { message: 'Content not found' },
        { status: 500 }
      )
    }
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
  return NextResponse.json(
    { message: 'Internal Server Error' },
    { status: 500 }
  )
}

/**
 * Type guard that checks whether metadata includes a `url` object
 * with one of the expected shapes (simple/hierarchical).
 *
 * @param metadata - Unknown metadata value to inspect.
 * @returns {metadata is { url: { type?: string; default?: string; hierarchical?: string } }} True if `url` is present.
 */
function hasUrlMetadata(metadata: unknown): metadata is {
  url: {
    type?: string
    default?: string
    hierarchical?: string
  }
} {
  return (
    !!metadata &&
    typeof metadata === 'object' &&
    'url' in metadata &&
    typeof (metadata as any).url === 'object'
  )
}
