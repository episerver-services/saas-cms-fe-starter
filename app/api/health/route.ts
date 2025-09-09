export const dynamic = 'force-dynamic'

/**
 * Health check endpoint for Playwright and monitoring.
 *
 * This lightweight API route always returns HTTP 200 with "ok" in the body.
 * It is primarily used by Playwright’s `webServer.url` config to verify that
 * the Next.js app has started successfully, but can also serve as a generic
 * health/liveness probe in other environments.
 *
 * ⚠️ Note: This route is intended for local development and automated testing.
 * Do not expose it as a public health endpoint in production unless explicitly
 * required, as it does not perform any deeper application checks.
 *
 * @returns {Response} Plain-text "ok" response with status 200
 */
export async function GET(): Promise<Response> {
  return new Response('ok', {
    status: 200,
    headers: { 'Content-Type': 'text/plain' },
  })
}
