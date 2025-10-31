import { draftMode } from 'next/headers'

/**
 * Environment-aware wrapper around Next.js `draftMode()`.
 *
 * - In **production**:
 *   Returns `true` only if draft mode is explicitly enabled by Next.js (via token + cookie).
 *
 * - In **development**:
 *   Returns `true` if draft mode is enabled *or* if middleware validation is not enforced.
 *   (e.g., local testing without preview cookies.)
 *
 * @returns {Promise<boolean>} `true` if draft mode is active or permitted for local testing.
 */
export async function checkDraftMode(): Promise<boolean> {
  const { isEnabled } = await draftMode()
  const isDev = process.env.NODE_ENV !== 'production'

  // Production: strictly honor Next.js draft cookie
  if (!isDev) return isEnabled

  // Development: allow fallback for local testing
  if (!isEnabled) {
    console.warn('[checkDraftMode] Draft mode disabled; allowing in dev environment')
    return true
  }

  return isEnabled
}