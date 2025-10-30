import { getMockResponse } from '@/__mocks__/preview-page'
import { isVercelError } from '../type-guards'
import { draftMode } from 'next/headers'

/**
 * Options for the low-level Optimizely GraphQL fetcher.
 *
 * - `headers`   Extra HTTP headers to include.
 * - `cache`     Next.js/Fetch cache mode (e.g., 'force-cache', 'no-store').
 * - `preview`   Force preview auth (overrides Draft Mode detection).
 * - `cacheTag`  Optional Next.js tag to associate with the request for revalidation.
 */
interface OptimizelyFetchOptions {
  headers?: Record<string, string>
  cache?: RequestCache
  preview?: boolean
  cacheTag?: string
}

/**
 * Envelope of a GraphQL request.
 */
interface OptimizelyFetch<Variables> extends OptimizelyFetchOptions {
  query: string
  variables?: Variables
}

/**
 * Minimal GraphQL response shape.
 */
interface GraphqlResponse<Response> {
  errors: unknown[]
  data: Response
}

/**
 * Safely checks whether Next.js Draft Mode is enabled.
 *
 * Draft Mode (`draftMode()`) throws if called outside a request scope
 * (e.g., during build, server preboot, or Playwright’s dev server boot).
 * This helper returns `false` instead of throwing in those contexts.
 *
 * @returns Promise<boolean> true if Draft Mode is enabled, else false.
 */
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
 * Low-level GraphQL fetcher for Optimizely, with dev-friendly fallbacks.
 *
 * Behavior by environment variables:
 * - `NEXT_PUBLIC_MOCK_OPTIMIZELY=true`: returns local mock data via `getMockResponse`.
 * - `IS_BUILD=true`: short-circuits with empty data (no network access during SSG).
 * - `OPTIMIZELY_API_URL` / `OPTIMIZELY_SINGLE_KEY`: required for real requests.
 * - `preview=true`: sets Basic auth using `OPTIMIZELY_PREVIEW_SECRET` and disables caching.
 *
 * @template Response GraphQL data payload shape
 * @template Variables GraphQL variables shape
 * @param args GraphQL request + fetch options
 * @returns GraphQL response plus the raw `Headers` from `fetch`
 * @throws When required environment variables are missing or the request fails
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
  const isMock = process.env.NEXT_PUBLIC_MOCK_OPTIMIZELY === 'true'

  // 🧪 Dev mock path
  if (isMock) {
    const data = getMockResponse<Response>(query, variables)
    return { data, errors: [], headers: new Headers() }
  }

  // 🏗️ Build-time short-circuit (avoid network)
  if (process.env.IS_BUILD === 'true') {
    return { data: {} as Response, errors: [], headers: new Headers() }
  }

  const apiUrl = process.env.OPTIMIZELY_API_URL
  const apiKey = process.env.OPTIMIZELY_SINGLE_KEY
  if (!apiUrl || !apiKey) {
    throw new Error('Missing OPTIMIZELY_API_URL or OPTIMIZELY_SINGLE_KEY')
  }

  const configHeaders = { ...headers }

  // Preview auth (Basic) + disable cache
  if (preview) {
    const previewSecret = process.env.OPTIMIZELY_PREVIEW_SECRET
    if (!previewSecret) {
      if (process.env.NODE_ENV === 'development') {
        const data = getMockResponse<Response>(query, variables)
        return { data, errors: [], headers: new Headers() }
      }
      throw new Error('Missing OPTIMIZELY_PREVIEW_SECRET in preview mode')
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
 * Tiny SDK-style requester that:
 *  - Detects Draft Mode safely (using {@link safeDraftEnabled})
 *  - Forwards through to {@link optimizelyFetch}
 *
 * Pass `options.preview` explicitly to override Draft Mode detection.
 *
 * @template T Response payload type
 * @template V Variables type
 * @param query GraphQL query string
 * @param variables GraphQL variables
 * @param options Additional fetch options
 * @returns Resolved `data` field from the GraphQL response
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
 * Local, minimal Optimizely SDK.
 *
 * These methods intentionally reference placeholder queries (e.g. `'query ... { }'`).
 * In real integration, swap these for generated SDK calls from GraphQL Codegen.
 * While mocking (`NEXT_PUBLIC_MOCK_OPTIMIZELY=true`), requests are satisfied by `getMockResponse`.
 */
export const optimizely = {
  /** Retrieves the StartPage content in preview mode. */
  async GetPreviewStartPage(variables: { locales: string[]; version: string }) {
    return requester<
      {
        StartPage: {
          item: {
            blocks?: { __typename: string; [key: string]: unknown }[]
          }
        }
      },
      typeof variables
    >('query GetPreviewStartPage { ... }', variables, { preview: true })
  },

  /** Retrieves a single CMS block component by key (Visual Builder preview). */
  async GetComponentByKey(
    variables: { locales: string[]; key: string; version: string },
    options?: { preview?: boolean }
  ) {
    return requester<
      {
        _Component: {
          item: { __typename: string; [key: string]: unknown }
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
                component: { __typename: string; [key: string]: unknown }
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
      '[NEXT_PUBLIC_MOCK_OPTIMIZELY] getPageByURL() stub used with:',
      variables,
      options
    )
    return { CMSPage: { item: null } }
  },

  /** Retrieves all CMS pages for static param generation (e.g., ISR). */
  async AllPages(variables: { pageType: string[] }) {
    return requester<
      {
        _Content: {
          items: {
            _metadata?: { url?: { default?: string } }
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
            _metadata?: { guid: string; [key: string]: unknown }
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
            blocks?: { __typename: string; [key: string]: unknown }[]
            _metadata?: { modified: string; [key: string]: unknown }
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
            _metadata?: { version?: string; [key: string]: unknown }
            composition: {
              displayName: string
              nodes: {
                displaySettings: Record<string, unknown>
                component: { __typename: string; [key: string]: unknown }
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
            blocks?: { __typename: string; [key: string]: unknown }[]
            _metadata?: { version?: string; [key: string]: unknown }
            [key: string]: unknown
          }[]
        }
      },
      typeof variables
    >('query GetAllStartPageVersions { ... }', variables, options)
  },
}
