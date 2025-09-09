/**
 * Describes the shape of a typical Vercel-style error object
 * as returned by middleware, Next.js handlers, or API routes.
 */
export interface VercelErrorLike {
  status: number
  message: Error | Error
  cause?: Error
}

/**
 * Type guard that checks whether a value is a plain object (not null, not an array).
 *
 * Useful for runtime validation of unknown values before property access.
 *
 * @param value - The value to validate.
 * @returns True if the value is a plain object.
 */
export const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Type guard that determines whether an unknown error object matches the VercelErrorLike interface.
 *
 * It supports:
 * - Native `Error` instances
 * - Objects extending from `Error`
 * - POJOs with a matching prototype chain
 *
 * @param error - The value to test.
 * @returns True if the error is compatible with VercelErrorLike.
 */
export const isVercelError = (error: unknown): error is VercelErrorLike => {
  if (!isObject(error)) return false
  if (error instanceof Error) return true
  return isErrorLikeViaPrototype(error)
}

/**
 * Recursively traverses an object's prototype chain to detect inheritance from `Error`.
 *
 * This handles edge cases like custom error classes or errors passed across runtime boundaries.
 *
 * @param obj - The object to inspect.
 * @returns True if any prototype in the chain resembles an `Error`.
 */
function isErrorLikeViaPrototype<T extends object>(obj: T): boolean {
  if (Object.prototype.toString.call(obj) === '[object Error]') {
    return true
  }

  const prototype = Object.getPrototypeOf(obj) as T | null
  return prototype !== null ? isErrorLikeViaPrototype(prototype) : false
}
