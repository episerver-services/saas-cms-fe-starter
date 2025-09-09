import { onCLS, onINP, onLCP, onTTFB, onFCP, Metric } from 'web-vitals'

/**
 * Observes Core Web Vitals in the browser and logs them to the console.
 *
 * This is intended primarily for development/debugging.
 * In production, extend the logger to send metrics to your analytics or monitoring backend.
 *
 * Core Web Vitals tracked:
 * - **CLS** (Cumulative Layout Shift): Visual stability
 * - **INP** (Interaction to Next Paint): Input responsiveness
 * - **LCP** (Largest Contentful Paint): Loading performance
 * - **TTFB** (Time to First Byte): Server response latency
 * - **FCP** (First Contentful Paint): Initial rendering speed
 *
 * @example
 * // Log vitals in console
 * observeVitals()
 *
 * @example
 * // Send vitals to analytics
 * observeVitals((metric) => {
 *   fetch('/analytics', {
 *     method: 'POST',
 *     body: JSON.stringify(metric),
 *   })
 * })
 *
 * @param {function} [callback] - Optional custom handler for metric events.
 * Defaults to console logging.
 */
export function observeVitals(callback?: (metric: Metric) => void): void {
  const log =
    callback ??
    ((metric: Metric) => {
      console.log(`[Web Vitals] ${metric.name}: ${metric.value}`)
    })

  onCLS(log)
  onINP(log)
  onLCP(log)
  onTTFB(log)
  onFCP(log)
}
