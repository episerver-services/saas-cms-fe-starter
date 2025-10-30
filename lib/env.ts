/**
 * Environment utility functions for Optimizely integration.
 *
 * Provides consistent access to environment flags used
 * for mock preview and Visual Builder support.
 */

/**
 * Returns true if the app is running in "mock Optimizely" mode.
 * Used for local development and preview without a live CMS connection.
 *
 * Controlled by the env var: `NEXT_PUBLIC_MOCK_OPTIMIZELY=true`
 */
export const isMockOptimizely = (): boolean =>
  process.env.NEXT_PUBLIC_MOCK_OPTIMIZELY === 'true'
