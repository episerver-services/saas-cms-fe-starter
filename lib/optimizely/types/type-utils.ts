// ─────────────────────────────────────────────
//  Optimizely Content Fallback Types & Helpers
// ─────────────────────────────────────────────

/**
 * Minimal fallback version of the `_IContent` type.
 *
 * Used when GraphQL Codegen types are unavailable or stripped out
 * (e.g., in mock-only or transitional builds).
 * Provides a loose record with an optional `__typename` for narrowing.
 */
export interface _IContent {
  __typename?: string
  [key: string]: unknown
}

/**
 * Safer variant of `_IContent` that guarantees an optional `__typename`.
 *
 * Useful for narrowing without having to guard for `undefined`.
 */
export type SafeContent = {
  __typename?: string
} & _IContent

/**
 * Utility type: extracts a specific content type from `_IContent`
 * based on its `__typename` discriminator.
 *
 * @template T - A type that includes a `__typename` field.
 *
 * @example
 * type Hero = ExtractContent<{ __typename: 'HeroBlock' }>
 */
export type ExtractContent<T extends { __typename: string }> = Extract<
  _IContent,
  { __typename?: T['__typename'] }
>

/**
 * Runtime-safe type guard for narrowing Optimizely content items.
 *
 * Compares the `__typename` field and returns the content
 * as the target type if it matches, or `null` otherwise.
 *
 * @template T - Target type with an optional `__typename`.
 *
 * @param content - The content item to check (may be `null` or `undefined`).
 * @param typename - The expected `__typename` to match.
 * @returns The content narrowed to type `T` if matched, otherwise `null`.
 *
 * @example
 * const hero = castContent<HeroBlock>(item, 'HeroBlock')
 * if (hero) {
 *   // hero is typed as HeroBlock here
 * }
 */
export function castContent<T extends { __typename?: string }>(
  content: SafeContent | null | undefined,
  typename: T['__typename']
): T | null {
  if (content && content.__typename === typename) {
    return content as unknown as T
  }
  return null
}
