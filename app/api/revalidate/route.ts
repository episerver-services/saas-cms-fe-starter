import { optimizely } from '@/lib/optimizely/fetch'
import { revalidatePath, revalidateTag } from 'next/cache'
import { type NextRequest, NextResponse } from 'next/server'
import crypto from 'node:crypto'

/**
 * Handles Optimizely webhook POST requests for content publishing.
 * Validates the webhook (HMAC header if provided, otherwise query secret),
 * resolves the content by GUID, determines its URL, and triggers revalidation
 * for the corresponding Next.js page or cache tag.
 *
 * @param request - The incoming webhook POST request.
 * @returns A JSON response indicating success or failure.
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
 * If the request includes an HMAC signature header and a shared secret is set,
 * verify the signature. Otherwise no-op (falls back to query secret).
 *
 * Uses header: `x-optimizely-signature` (hex), algo: HMAC-SHA256.
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
 * Validates the Optimizely webhook secret in the request query string.
 * Throws an error if the secret is missing or invalid.
 *
 * Works with both NextRequest and the standard Request used in tests.
 */
function validateWebhookSecret(request: NextRequest | Request): void {
  const secret = new URL(request.url).searchParams.get('cg_webhook_secret')
  const expected = process.env.OPTIMIZELY_REVALIDATE_SECRET
  if (secret !== expected) {
    throw new Error('Invalid credentials')
  }
}

/**
 * Safely parses JSON and extracts a string docId, or ''.
 * Converts bad JSON into a clean 400 response via the error mapper.
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
 * Fetches Optimizely content by GUID.
 *
 * @param guid - The cleaned GUID (without dashes).
 * @returns The resolved content item from the CMS.
 * @throws If content is not found.
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
 * Ensures the URL is locale-prefixed and cleaned of trailing slashes.
 *
 * @param url - The CMS-provided relative URL.
 * @param locale - Locale to prefix (e.g., "en").
 * @returns The locale-prefixed normalized path.
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
 * Revalidates either a cache tag or a specific page path.
 * Uses exact path segment matching for "header" and "footer" tags.
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
 * Handles and formats errors into a JSON response.
 *
 * @param error - The thrown error during request processing.
 * @returns A formatted JSON response with error status.
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
 * Type guard to check if the given metadata includes a `url` field.
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
