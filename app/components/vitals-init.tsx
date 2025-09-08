'use client'

import { useEffect } from 'react'
import { observeVitals } from '@/lib/utils/observe-web-vitals'

/**
 * Client component to initialise Web Vitals observation once on mount.
 */
export default function VitalsInit() {
  useEffect(() => {
    observeVitals()
  }, [])

  return null
}
