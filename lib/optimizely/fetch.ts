import { getMockResponse } from '@/__mocks__/preview-page'
import { isVercelError } from '../type-guards'
import { draftMode } from 'next/headers'

interface OptimizelyFetchOptions {
  headers?: Record<string, string>
  cache?: RequestCache
  preview?: boolean
  cacheTag?: string
}

interface OptimizelyFetch<Variables> extends OptimizelyFetchOptions {
  query: string
  variables?: Variables
}

interface GraphqlResponse<Response> {
  errors: unknown[]
  data: Response
}

/** Safely read Next.js draft mode without requiring a request context. */
async function safeDraftEnabled(): Promise<boolean> {
  try {
    const { isEnabled } = await draftMode()
    return !!isEnabled
  } catch {
    // Outside a request scope (build, preboot, playwright webServer, etc.)
    return false
  }
}

/**
 * Fetches GraphQL data from Optimizely or returns mock data when enabled.
 *
 * @template Response - GraphQL response shape
 * @template Variables - GraphQL query variables
 */
export const optimizelyFetch = async <Response, Variables = object>({
  query,
  variables,
  headers,
  cache = 'force-cache',
  preview,
  cacheTag,
}: OptimizelyFetch<Variables>): Promise<
  GraphqlResponse<Response> & { headers: Headers }
> => {
  const isMock = process.env.MOCK_OPTIMIZELY === 'true'

  // 🧪 Return mock response (dev-only)
  if (isMock) {
    const data = getMockResponse<Response>(query, variables)
    return {
      data,
      errors: [],
      headers: new Headers(),
    }
  }

  // 🏗️ Skip fetch during static builds
  if (process.env.IS_BUILD === 'true') {
    return {
      data: {} as Response,
      errors: [],
      headers: new Headers(),
    }
  }

  const apiUrl = process.env.OPTIMIZELY_API_URL
  const apiKey = process.env.OPTIMIZELY_SINGLE_KEY

  if (!apiUrl || !apiKey) {
    throw new Error('Missing OPTIMIZELY_API_URL or OPTIMIZELY_SINGLE_KEY')
  }

  const configHeaders = { ...headers }

  if (preview) {
    const previewSecret = process.env.OPTIMIZELY_PREVIEW_SECRET
    if (!previewSecret) {
      if (process.env.NODE_ENV === 'development') {
        const data = getMockResponse<Response>(query, variables)
        return {
          data,
          errors: [],
          headers: new Headers(),
        }
      } else {
        throw new Error('Missing OPTIMIZELY_PREVIEW_SECRET in preview mode')
      }
    }
    configHeaders.Authorization = `Basic ${previewSecret}`
    cache = 'no-store'
  }

  const endpoint = `${apiUrl}?auth=${apiKey}`
  const cacheTags = ['optimizely-content', cacheTag].filter(Boolean)

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...configHeaders,
      },
      body: JSON.stringify({
        query,
        ...(variables && { variables }),
      }),
      cache,
      next: { tags: cacheTags as string[] },
    })

    const result = await response.json()
    return { ...result, headers: response.headers }
  } catch (error) {
    if (isVercelError(error)) {
      throw { status: error.status || 500, message: error.message, query }
    }
    throw { error, query }
  }
}

/**
 * Lightweight GraphQL SDK-style requester.
 * Automatically enables preview mode when Next.js Draft Mode is active.
 */
const requester = async <T, V>(
  query: string,
  variables: V,
  options: OptimizelyFetchOptions = {}
): Promise<T> => {
  const isPreview = options.preview ?? (await safeDraftEnabled())

  return (
    await optimizelyFetch<T, V>({
      query,
      variables,
      ...options,
      preview: isPreview,
    })
  ).data
}

// ─────────────────────────────────────
// 🔌 Local SDK (stubbed queries only)
// ─────────────────────────────────────

/**
 * Local mock-only Optimizely SDK.
 * Replace or extend these queries manually until GraphQL Codegen is restored.
 */
export const optimizely = {
  /** Retrieves the StartPage content in preview mode. */
  async GetPreviewStartPage(variables: { locales: string[]; version: string }) {
    return requester<
      {
        StartPage: {
          item: {
            blocks?: {
              __typename: string
              [key: string]: unknown
            }[]
          }
        }
      },
      typeof variables
    >('query GetPreviewStartPage { ... }', variables, {
      preview: true,
    })
  },

  /** Retrieves a single CMS block component by key (Visual Builder preview). */
  async GetComponentByKey(
    variables: { locales: string[]; key: string; version: string },
    options?: { preview?: boolean }
  ) {
    return requester<
      {
        _Component: {
          item: {
            __typename: string
            [key: string]: unknown
          }
        }
      },
      typeof variables
    >('query GetComponentByKey { ... }', variables, options)
  },

  /** Retrieves a full-page Experience layout by key (Visual Builder). */
  async VisualBuilder(
    variables: { key: string; version: string; locales: string[] },
    options?: { preview?: boolean }
  ) {
    return requester<
      {
        Experience: {
          item: {
            __typename: string
            composition: {
              displayName: string
              nodes: {
                displaySettings: Record<string, unknown>
                component: {
                  __typename: string
                  [key: string]: unknown
                }
                key: string
              }[]
            }
          }
        }
      },
      typeof variables
    >('query VisualBuilder { ... }', variables, options)
  },

  /** Stub for fetching CMS pages by URL slug (mock-only). */
  async getPageByURL(
    variables: { locales: string[]; slug: string },
    options?: { preview?: boolean }
  ) {
    console.warn(
      '[MOCK_OPTIMIZELY] getPageByURL() stub used with:',
      variables,
      options
    )
    return {
      CMSPage: { item: null },
    }
  },

  /** Retrieves all CMS pages for static param generation (e.g. ISR). */
  async AllPages(variables: { pageType: string[] }) {
    return requester<
      {
        _Content: {
          items: {
            _metadata?: {
              url?: {
                default?: string
              }
            }
          }[]
        }
      },
      typeof variables
    >('query AllPages { ... }', variables)
  },

  /** Retrieves content by GUID (used in revalidate route). */
  async GetContentByGuid(variables: { guid: string }) {
    return requester<
      {
        _Content: {
          items: {
            __typename: string
            _metadata?: {
              guid: string
              [key: string]: unknown
            }
            [key: string]: unknown
          }[]
        }
      },
      typeof variables
    >('query GetContentByGuid { ... }', variables)
  },

  /** Retrieves CMSPage by slug and version (used in Visual Builder preview fallback). */
  async GetAllPagesVersionByURL(
    variables: { locales: string[]; slug: string },
    options?: { preview?: boolean }
  ) {
    return requester<
      {
        CMSPage: {
          item: {
            __typename: string
            title: string
            shortDescription?: string
            keywords?: string
            blocks?: {
              __typename: string
              [key: string]: unknown
            }[]
            _metadata?: {
              modified: string
              [key: string]: unknown
            }
            [key: string]: unknown
          } | null
        }
      },
      typeof variables
    >('query GetAllPagesVersionByURL { ... }', variables, options)
  },

  /** Retrieves all versions of a Visual Builder Experience by slug. */
  async GetAllVisualBuilderVersionsBySlug(
    variables: { locales: string[]; slug: string },
    options?: { preview?: boolean }
  ) {
    return requester<
      {
        SEOExperience: {
          items: {
            __typename: string
            _metadata?: {
              version?: string
              [key: string]: unknown
            }
            composition: {
              displayName: string
              nodes: {
                displaySettings: Record<string, unknown>
                component: {
                  __typename: string
                  [key: string]: unknown
                }
                key: string
              }[]
            }
          }[]
        }
      },
      typeof variables
    >('query GetAllVisualBuilderVersionsBySlug { ... }', variables, options)
  },

  /** Retrieves all versions of the StartPage content (used in preview mode). */
  async GetAllStartPageVersions(
    variables: { locales: string[] },
    options?: { preview?: boolean }
  ) {
    return requester<
      {
        StartPage: {
          items: {
            blocks?: {
              __typename: string
              [key: string]: unknown
            }[]
            _metadata?: {
              version?: string
              [key: string]: unknown
            }
            [key: string]: unknown
          }[]
        }
      },
      typeof variables
    >('query GetAllStartPageVersions { ... }', variables, options)
  },
}
