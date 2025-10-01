/**
 * ⚠️ Optimizely SDK is currently disabled (mock-only mode).
 *
 * This wrapper is scaffolded for future integration with the Optimizely GraphQL Codegen output.
 *
 * To enable:
 * 1. Place `.graphql` queries in `lib/optimizely/queries/`
 * 2. Run `pnpm graphql:codegen` to generate `lib/optimizely/sdk.ts`
 * 3. Uncomment the code below
 *
 * The generated SDK will give you strongly typed methods for querying the CMS.
 * It uses a custom `requester()` function that wraps `optimizelyFetch()` internally.
 *
 * @example
 * ```ts
 * const { _Content } = await sdk.AllPages({ pageType: ['LandingPage'] })
 * ```
 */

// import { getSdk } from '@/lib/optimizely/sdk'
// import { optimizelyFetch } from './fetch'
// import { print, DocumentNode } from 'graphql'

// const requester = async <Response, Variables>(
//   document: DocumentNode,
//   variables?: Variables
// ): Promise<Response> => {
//   return (
//     await optimizelyFetch<Response, Variables>({
//       query: print(document),
//       variables,
//     })
//   ).data
// }

// export const sdk = getSdk(requester)
