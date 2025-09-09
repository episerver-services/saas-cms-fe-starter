import { draftMode } from 'next/headers'

/**
 * Disables Next.js draft mode (preview mode) by clearing the draft cookies.
 *
 * This is typically invoked when a CMS editor exits preview mode,
 * effectively "logging out" of draft content editing.
 *
 * @returns {Response} A `200 OK` plain text response confirming that draft mode is disabled.
 * @throws If `draftMode()` cannot be resolved (e.g., outside a server context).
 */
export async function GET() {
  ;(await draftMode()).disable()
  return new Response('Draft mode is disabled')
}
