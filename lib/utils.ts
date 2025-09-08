import { ReadonlyURLSearchParams } from 'next/navigation'
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Constructs a complete URL from a pathname and a set of query parameters.
 *
 * @param pathname - The base route (e.g., `/search`).
 * @param params - A `URLSearchParams` or `ReadonlyURLSearchParams` instance.
 * @returns A full URL with query string (e.g., `/search?q=foo&page=1`).
 */
export function createUrl(
  pathname: string,
  params: URLSearchParams | ReadonlyURLSearchParams
): string {
  const query = params.toString()
  return `${pathname}${query ? `?${query}` : ''}`
}

/**
 * Ensures a pathname starts with a leading slash.
 *
 * @param path - Any path fragment (e.g., `about` or `/about`).
 * @returns The same path with `/` prepended if needed.
 */
export function withLeadingSlash(path: string): string {
  return path.startsWith('/') ? path : `/${path}`
}

/**
 * Merges and deduplicates Tailwind CSS class names.
 *
 * Combines `clsx` for conditional logic and `tailwind-merge` for conflict resolution.
 *
 * @param classes - One or more class strings or expressions.
 * @returns A deduplicated and merged className string.
 */
export function cn(...classes: ClassValue[]): string {
  return twMerge(clsx(classes))
}
