'use client'

import { useEffect } from 'react'
import { observeVitals } from '@/lib/utils/observe-web-vitals'

/**
 * Initializes [Web Vitals](https://web.dev/vitals/) tracking on the client.
 *
 * Runs once on component mount and reports metrics via `observeVitals()`.
 * This is typically included once at the root layout level to start analytics.
 *
 * @returns `null` – this component has no visual output.
 */
export default function VitalsInit() {
  useEffect(() => {
    observeVitals()
  }, [])

  return null
}
