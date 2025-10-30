'use client'

import { useEffect, useState } from 'react'

/**
 * Detects whether the current app is running inside
 * the Optimizely Visual Builder iframe.
 *
 * Visual Builder loads your frontend within an iframe
 * hosted on the Optimizely CMS domain. This hook lets
 * you conditionally render edit-mode helpers or injectors
 * only when actually embedded in that environment.
 *
 * @returns `true` if the current window is inside the Visual Builder iframe.
 *
 * @example
 * ```tsx
 * const isInsideVB = useIsInsideVB();
 * if (!isInsideVB) return null; // skip edit helpers outside VB
 * ```
 */
export function useIsInsideVB(): boolean {
  const [isInsideVB, setIsInsideVB] = useState(false)

  useEffect(() => {
    try {
      // window.top !== window.self → means we're in an iframe
      const inIframe = window.top !== window.self

      // In VB context, the referrer or parent origin usually includes optimizely.com
      const fromOptimizely =
        document.referrer.includes('optimizely.com') ||
        window.parent?.location?.host?.includes('optimizely.com')

      setIsInsideVB(inIframe && !!fromOptimizely)
    } catch {
      // Accessing window.parent.location can throw cross-origin errors
      setIsInsideVB(true)
    }
  }, [])

  return isInsideVB
}