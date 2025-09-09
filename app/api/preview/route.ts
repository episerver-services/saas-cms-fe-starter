import { draftMode } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Enables Next.js draft mode (preview mode) and redirects the user.
 *
 * This route is typically called when entering preview mode via a URL like:
 * `/api/preview?url=/some/page`.
 *
 * Steps:
 * - Extracts the `url` query parameter from the request.
 * - Resolves the target into an absolute URL.
 * - Enables draft mode using Next.js headers API.
 * - Redirects the user to the specified target.
 *
 * @param req - The incoming Next.js `NextRequest` object.
 * @returns {NextResponse} A redirect to the target URL if provided,
 * or a `400 Bad Request` response if the `url` parameter is missing.
 * @throws If `draftMode()` fails or the target URL is invalid.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const targetUrl = searchParams.get('url')

  if (!targetUrl) {
    return new NextResponse('Missing URL param', { status: 400 })
  }

  // Ensure absolute URL: relative paths get resolved against request origin
  const absoluteUrl = new URL(targetUrl, new URL(req.url).origin)

  const dm = await draftMode()
  dm.enable()

  return NextResponse.redirect(absoluteUrl)
}
