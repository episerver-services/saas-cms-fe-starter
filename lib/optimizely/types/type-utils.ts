// Fallback version of _IContent (used in place of the removed GraphQL SDK types)
export interface _IContent {
  __typename?: string
  [key: string]: unknown
}

/**
 * A version of _IContent that always includes an optional __typename.
 * Used for safer type narrowing.
 */
export type SafeContent = {
  __typename?: string
} & _IContent

/**
 * Extracts a specific content type from the _IContent union based on its __typename.
 *
 * @template T - A type that includes a `__typename` field.
 */
export type ExtractContent<T extends { __typename: string }> = Extract<
  _IContent,
  { __typename?: T['__typename'] }
>

/**
 * Safely casts a content item to a specific type by comparing its `__typename`.
 *
 * @template T - The target type to cast to, which must include an optional `__typename`.
 * @param content - The content object to cast, which may be null or undefined.
 * @param typename - The expected `__typename` to match.
 * @returns The content cast as the specific type if the `__typename` matches, otherwise `null`.
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
