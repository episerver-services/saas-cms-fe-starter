import { ReadonlyURLSearchParams } from 'next/navigation'
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

type QueryPrimitive = string | number | boolean | null | undefined
type QueryObject = Record<string, QueryPrimitive | QueryPrimitive[]>

/**
 * Constructs a complete URL from a pathname and query parameters.
 *
 * Accepts:
 * - `URLSearchParams` / `ReadonlyURLSearchParams`
 * - A plain object (values can be string/number/boolean, null/undefined, or arrays)
 *
 * `null`/`undefined` values are omitted. Arrays become repeated params: `{ tag: ['a','b'] }` → `?tag=a&tag=b`
 *
 * @param pathname - The base route (e.g., `/search`).
 * @param params - URLSearchParams, ReadonlyURLSearchParams, or a plain object.
 * @returns The full URL including query string if present (e.g., `/search?q=foo&page=1`).
 *
 * @example
 * createUrl('/search', { q: 'foo', page: 2, tag: ['a','b'], empty: undefined })
 * // -> "/search?q=foo&page=2&tag=a&tag=b"
 */
export function createUrl(
  pathname: string,
  params: URLSearchParams | ReadonlyURLSearchParams | QueryObject
): string {
  const usp =
    params instanceof URLSearchParams ||
    (typeof (params as any)?.get === 'function' &&
      typeof (params as any)?.toString === 'function')
      ? new URLSearchParams(params as URLSearchParams | ReadonlyURLSearchParams)
      : objectToSearchParams(params as QueryObject)

  const query = usp.toString()
  return `${pathname}${query ? `?${query}` : ''}`
}

function objectToSearchParams(obj: QueryObject): URLSearchParams {
  const usp = new URLSearchParams()

  if (!obj) return usp

  for (const [key, raw] of Object.entries(obj)) {
    if (raw == null) continue // skip null/undefined

    const values = Array.isArray(raw) ? raw : [raw]
    for (const v of values) {
      if (v == null) continue
      usp.append(key, String(v))
    }
  }

  return usp
}

/**
 * Ensures a pathname starts with a leading slash.
 *
 * @param path - Any path fragment (e.g., `about` or `/about`).
 * @returns The same path with a `/` prepended if missing.
 */
export function withLeadingSlash(path: string): string {
  return path.startsWith('/') ? path : `/${path}`
}

/**
 * Merges and deduplicates Tailwind CSS class names.
 *
 * Combines:
 * - `clsx` for conditional class logic
 * - `tailwind-merge` for conflict resolution (e.g., `p-2 p-4` → `p-4`)
 *
 * @param classes - One or more class strings or conditional expressions.
 * @returns A single, deduplicated className string.
 *
 * @example
 * ```tsx
 * <button className={cn(
 *   'p-2 text-sm',
 *   isActive && 'bg-blue-500',
 *   'p-4' // overrides p-2
 * )}>
 *   Click me
 * </button>
 * ```
 */
export function cn(...classes: ClassValue[]): string {
  return twMerge(clsx(classes))
}
