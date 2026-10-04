/**
 * A "safe string" is template output that's already safe to be written
 * to the output directly, i.e. template literals and already-escaped
 * output. It's used to avoid double-escaping when `outputEscape` is set:
 * values produced by the template itself (e.g. `{% capture %}`, `block.super`)
 * are marked as safe, while external data and filter results remain plain
 * strings and get escaped on output.
 *
 * It's implemented as a `String` object with a non-enumerable marker
 * property, rather than a wrapper class, so that:
 * - it behaves like a string for filters, comparisons and property access
 *   (e.g. `value.toUpperCase()`, `value.length`, `value[0]` all work)
 * - `JSON.stringify` unwraps it like a plain string
 * - it works on ES5 targets where `class extends String` breaks
 * - the marker survives across multiple copies/realms of this library
 */
const SAFE_STRING_MARK = '__liquidjs_safe_string__'

export function toSafeString (value: string): string {
  // eslint-disable-next-line no-new-wrappers
  const str = new String(value) as any
  Object.defineProperty(str, SAFE_STRING_MARK, { value: true })
  return str
}

export function isSafeString (value: any): boolean {
  return !!value && value[SAFE_STRING_MARK] === true
}
