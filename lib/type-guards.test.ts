// lib/type-guards.test.ts
import { isObject, isVercelError, type VercelErrorLike } from './type-guards'

describe('type-guards: isObject', () => {
  it('returns true for plain objects', () => {
    expect(isObject({ a: 1 })).toBe(true)
    expect(isObject(Object.create(null))).toBe(true) // still an object
  })

  it('returns false for null, arrays, functions, and primitives', () => {
    expect(isObject(null)).toBe(false)
    expect(isObject([1, 2, 3])).toBe(false)
    expect(isObject(() => {})).toBe(false)
    expect(isObject(123)).toBe(false)
    expect(isObject('hi')).toBe(false)
    expect(isObject(true)).toBe(false)
    expect(isObject(Symbol('x'))).toBe(false)
    expect(isObject(undefined)).toBe(false)
  })
})

describe('type-guards: isVercelError', () => {
  it('returns true for native Error instances', () => {
    const err = new Error('boom')
    expect(isVercelError(err)).toBe(true)
  })

  it('returns true for custom errors extending Error', () => {
    class MyError extends Error {
      status = 418
      cause = new Error('teapot')
      constructor(msg: string) {
        super(msg)
        this.name = 'MyError'
      }
    }
    const err = new MyError('short and stout')
    expect(isVercelError(err)).toBe(true)
  })

  it('returns true for POJOs that inherit from Error via prototype chain', () => {
    // Simulate cross-realm / deserialized shapes that still have Error in proto chain
    const protoErr = Object.create(
      Error.prototype
    ) as unknown as VercelErrorLike
    // Fill expected VercelErrorLike-ish props
    ;(protoErr as any).status = 500
    ;(protoErr as any).message = new Error('inherited')
    expect(isVercelError(protoErr)).toBe(true)
  })

  it('returns false for plain objects that only mimic the shape', () => {
    const fake: any = {
      status: 500,
      message: new Error('looks right but not Error-like via prototype'),
    }
    // No Error prototype in chain
    Object.setPrototypeOf(fake, Object.prototype)
    expect(isVercelError(fake)).toBe(false)
  })

  it('returns false for arrays, null, and primitives', () => {
    expect(isVercelError(null)).toBe(false)
    expect(isVercelError([new Error('nope')])).toBe(false)
    expect(isVercelError('boom')).toBe(false)
    expect(isVercelError(500)).toBe(false)
    expect(isVercelError(undefined)).toBe(false)
  })
})
