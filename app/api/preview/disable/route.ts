import { draftMode } from 'next/headers'

/**
 * Disables Next.js draft mode (preview mode) by clearing the draft cookies.
 *
 * Typically used as the logout or exit route from CMS preview mode.
 *
 * @returns {Response} A plain text confirmation response.
 */
export async function GET() {
  ;(await draftMode()).disable()
  return new Response('Draft mode is disabled')
}
