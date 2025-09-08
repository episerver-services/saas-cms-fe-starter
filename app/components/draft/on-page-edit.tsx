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
  version: string
  currentRoute: string
}

/**
 * Handles the Optimizely `contentSaved` event.
 * If a new version of the content is detected, redirects to the correct draft route.
 * Otherwise, refreshes the current page to show latest content.
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
