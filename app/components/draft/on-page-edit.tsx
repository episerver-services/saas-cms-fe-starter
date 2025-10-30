'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'
import { useRouter } from 'next/navigation'
import { useIsInsideVB } from '@/app/hooks/useIsInsideVB'

/**
 * Shape of the event payload emitted by Optimizely CMS when content is saved.
 */
interface ContentSavedEventArgs {
  contentLink: string
  previewUrl: string
  previewToken: string
  parentId?: string
  sectionId?: string
}

interface OnPageEditProps {
  /** The current content version displayed on the page */
  version: string
  /** The current draft route (e.g. `/draft/{version}/en/page`) */
  currentRoute: string
  /** Optional CMS app ID for loading communication injector */
  appId?: string
}

/**
 * React client component for Optimizely Visual Builder edit mode.
 *
 * - Listens for `optimizely:cms:contentSaved` → refresh or navigate
 * - Injects `communicationinjector.js` for VB overlays & editing
 * - Sends a handshake to VB once injector loads
 * - Observes DOM mutations → keeps overlays in sync
 * - Logs VB ↔ CMS messages for debugging
 */
export default function OnPageEdit({
  version,
  currentRoute,
  appId,
}: OnPageEditProps) {
  const router = useRouter()
  const isInsideVB = useIsInsideVB()
  const [injectorLoaded, setInjectorLoaded] = useState(false)

  // 🔹 1. Always handle CMS "contentSaved" event
  useEffect(() => {
    const handleContentSaved = (event: Event) => {
      const message = (event as CustomEvent).detail as ContentSavedEventArgs
      if (!message?.contentLink) return

      console.log('[VB] Content saved event received:', message)
      const [, contentVersion] = message.contentLink.split('_')

      if (contentVersion && contentVersion !== version) {
        const newUrl = currentRoute.replace(version, contentVersion)
        console.log(`[VB] Navigating to new version: ${newUrl}`)
        router.push(newUrl)
      } else {
        console.log('[VB] Refreshing current draft route')
        router.refresh()
      }
    }

    window.addEventListener('optimizely:cms:contentSaved', handleContentSaved)
    return () =>
      window.removeEventListener(
        'optimizely:cms:contentSaved',
        handleContentSaved
      )
  }, [router, version, currentRoute])

  // 🔹 2. VB-only: log postMessages for debugging
  useEffect(() => {
    if (!isInsideVB) return

    const onMessage = (e: MessageEvent) => {
      const origin = e.origin || 'unknown'
      const type = e.data?.type ?? 'unknown'

      if (
        typeof e.data === 'object' &&
        (type.startsWith('epi:') ||
          type.startsWith('Optimizely.') ||
          origin.includes('optimizely.com'))
      ) {
        console.log('[VB ↔ CMS]', origin, e.data)
      }
    }

    console.log('[VB Debug] Listening for postMessage traffic…')
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [isInsideVB])

  // 🔹 3. VB-only: send handshake + observe DOM after injector loads
  useEffect(() => {
    if (!isInsideVB || !injectorLoaded) return

    console.log('[VB] communicationinjector loaded — sending handshake')
    window.parent?.postMessage(
      { type: 'Optimizely.VisualBuilder.Handshake', timestamp: Date.now() },
      '*'
    )

    const observer = new MutationObserver(() => {
      window.parent?.postMessage(
        { type: 'Optimizely.VisualBuilder.DomUpdated', timestamp: Date.now() },
        '*'
      )
    })
    observer.observe(document.body, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [isInsideVB, injectorLoaded])

  // 🔹 4. Only inject the script when inside VB
  if (!isInsideVB) {
    console.log(
      '[VB] Not inside Visual Builder iframe — skipping injector load'
    )
    return null
  }

  if (!appId) {
    console.warn('[VB] Missing appId — cannot load communicationinjector')
    return null
  }

  const scriptSrc = `https://app-${appId}.cms.optimizely.com/util/javascript/communicationinjector.js`

  return (
    <Script
      src={scriptSrc}
      strategy="afterInteractive"
      onLoad={() => {
        console.log(`[VB] Injector loaded ✅ from ${scriptSrc}`)
        setInjectorLoaded(true)
      }}
      onError={(e) =>
        console.error('[VB] Injector failed to load ❌', e, `URL: ${scriptSrc}`)
      }
    />
  )
}
