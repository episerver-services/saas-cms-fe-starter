import { onCLS, onINP, onLCP, onTTFB, onFCP, Metric } from 'web-vitals'

/**
 * Subscribes to Core Web Vitals and logs them to the console.
 * You can extend this to send to analytics endpoints.
 */
export function observeVitals(): void {
  const log = (metric: Metric) => {
    console.log(`[Web Vitals] ${metric.name}: ${metric.value}`)
  }

  onCLS(log)
  onINP(log)
  onLCP(log)
  onTTFB(log)
  onFCP(log)
}
