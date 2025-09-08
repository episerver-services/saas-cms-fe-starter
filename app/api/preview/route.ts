import { draftMode } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Handles a GET request to enable Next.js draft mode and redirect the user.
 *
 * This route is typically used for entering preview mode by visiting a URL like:
 * `/api/preview?url=/some/page`.
 *
 * Steps:
 * - Extracts the `url` query parameter from the request.
 * - Enables draft mode using Next.js headers API.
 * - Redirects the user to the specified `url`.
 *
 * @param req - The incoming Next.js `NextRequest` object.
 * @returns A redirect `NextResponse` to the target URL, or a 400 if the param is missing.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const targetUrl = searchParams.get('url')

  if (!targetUrl) {
    return new NextResponse('Missing URL param', { status: 400 })
  }

  const dm = await draftMode()
  dm.enable()

  return NextResponse.redirect(targetUrl)
}
