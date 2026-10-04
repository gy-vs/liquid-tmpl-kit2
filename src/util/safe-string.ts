import { Drop } from '../drop/drop'
import { stringify } from './underscore'

/**
 * A string that is already safe to be written to the output, i.e. template
 * literals and values already processed by the `outputEscape` filter. When
 * `outputEscape` is enabled, values of this class won't be escaped again
 * when being output, captured or passed to layout blocks.
 *
 * It extends Drop so `toValue()` unwraps it to a plain string wherever
 * Liquid values are consumed (filters, operators, `stringify`, etc.),
 * which keeps the behavior of existing filters and tags unchanged.
 */
export class SafeString extends Drop {
  public constructor (private content: string) {
    super()
  }
  public valueOf (): string {
    return this.content
  }
  public toString (): string {
    return this.content
  }
  public toJSON (): string {
    return this.content
  }
  /** align with `string.length` for property access like `{{ str.length }}` */
  public get length (): number {
    return this.content.length
  }
  /** align with the `size` property of plain strings */
  public get size (): number {
    return this.content.length
  }
}

export function isSafeString (val: any): val is SafeString {
  return val instanceof SafeString
}

/** Unwrap a SafeString to its plain string, pass through any other value */
export function unwrapSafeString<T> (val: T): T | string {
  return isSafeString(val) ? val.toString() : val
}

/** Mark a value as safe output, no-op if it's already a SafeString */
export function toSafeString (val: any): SafeString {
  return isSafeString(val) ? val : new SafeString(stringify(val))
}

/**
 * Append a SafeString to a buffered value. The result stays a SafeString
 * only if the buffer is a SafeString itself, otherwise it's a plain string.
 */
export function concatSafeString (lhs: any, rhs: SafeString): string | SafeString {
  const result = stringify(lhs) + rhs.toString()
  return isSafeString(lhs) ? new SafeString(result) : result
}
