'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

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
}

/**
 * React client component that listens for the Optimizely
 * `optimizely:cms:contentSaved` event.
 *
 * - If a new content version is detected, it navigates to the updated draft route.
 * - If the version matches, it simply refreshes the current route to pull the latest content.
 *
 * Mounted in draft/preview routes to ensure editors see changes immediately.
 */
const OnPageEdit = ({ version, currentRoute }: OnPageEditProps) => {
  const router = useRouter()

  useEffect(() => {
    const handleContentSaved = (event: Event) => {
      const message = (event as CustomEvent).detail as ContentSavedEventArgs
      console.log('Content saved event received:', message)

      const [, contentVersion] = message?.contentLink?.split('_')
      if (contentVersion && contentVersion !== version) {
        const newUrl = currentRoute?.replace(version, contentVersion)
        router.push(newUrl)
      } else {
        router.refresh()
      }
    }

    window.addEventListener('optimizely:cms:contentSaved', handleContentSaved)
    return () => {
      window.removeEventListener(
        'optimizely:cms:contentSaved',
        handleContentSaved
      )
    }
  }, [currentRoute, router, version])

  return null
}

export default OnPageEdit
