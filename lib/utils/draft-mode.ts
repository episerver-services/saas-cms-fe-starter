import { draftMode } from 'next/headers'

/**
 * Environment-aware wrapper around Next.js `draftMode()`.
 *
 * - ✅ In **development** (`NODE_ENV !== 'production'`):
 *   Returns `true` even if draft mode is not explicitly enabled.
 *   This makes local preview/testing easier without needing a draft cookie.
 *
 * - ✅ In **production**:
 *   Returns `true` only if draft mode is explicitly enabled by Next.js.
 *
 * Also logs when draft mode is disabled but overridden in development,
 * so behaviour is transparent during local testing.
 *
 * @returns {Promise<boolean>} `true` if draft mode is active or overridden for dev, otherwise `false`.
 *
 * @example
 * ```ts
 * if (await checkDraftMode()) {
 *   // Fetch preview content
 * } else {
 *   // Fetch published content
 * }
 * ```
 */
export async function checkDraftMode(): Promise<boolean> {
  const { isEnabled: isDraftModeEnabled } = await draftMode()
  const isDevEnvironment = process.env.NODE_ENV !== 'production'

  if (!isDraftModeEnabled && isDevEnvironment) {
    console.log('Draft mode is disabled in development, but allowing access')
    return true
  }

  return isDraftModeEnabled
}
