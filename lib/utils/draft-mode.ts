import { draftMode } from 'next/headers'

/**
 * Checks whether Next.js Draft Mode is enabled.
 *
 * - In development (`NODE_ENV !== 'production'`), it returns `true` even if draft mode is not explicitly enabled.
 * - In production, it strictly requires draft mode to be enabled.
 *
 * @returns {Promise<boolean>} `true` if draft mode is active or allowed in development.
 */
export async function checkDraftMode() {
  const { isEnabled: isDraftModeEnabled } = await draftMode()
  const isDevEnvironment = process.env.NODE_ENV !== 'production'

  if (!isDraftModeEnabled && isDevEnvironment) {
    console.log('Draft mode is disabled in development, but allowing access')
    return true
  }

  return isDraftModeEnabled
}
