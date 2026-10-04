import { SafeString, concatSafeString, isSafeString, toSafeString, unwrapSafeString } from './safe-string'
import { stringify, toValue } from './underscore'

describe('util/safe-string', function () {
  describe('SafeString', function () {
    it('should unwrap to string via valueOf()', function () {
      expect(new SafeString('<b>').valueOf()).toBe('<b>')
    })
    it('should unwrap to string via toString()', function () {
      expect(new SafeString('<b>').toString()).toBe('<b>')
    })
    it('should unwrap to string via toJSON()', function () {
      expect(JSON.stringify(new SafeString('<b>'))).toBe('"<b>"')
    })
    it('should expose string length as `length` and `size`', function () {
      const str = new SafeString('foo')
      expect(str.length).toBe(3)
      expect(str.size).toBe(3)
    })
    it('should be unwrapped by toValue()', function () {
      expect(toValue(new SafeString('foo'))).toBe('foo')
    })
    it('should be unwrapped by stringify()', function () {
      expect(stringify(new SafeString('foo'))).toBe('foo')
    })
  })
  describe('.isSafeString()', function () {
    it('should return true for SafeString', function () {
      expect(isSafeString(new SafeString('foo'))).toBe(true)
    })
    it('should return false for plain string', function () {
      expect(isSafeString('foo')).toBe(false)
    })
    it('should return false for nil', function () {
      expect(isSafeString(undefined)).toBe(false)
      expect(isSafeString(null)).toBe(false)
    })
  })
  describe('.unwrapSafeString()', function () {
    it('should unwrap SafeString to plain string', function () {
      expect(unwrapSafeString(new SafeString('foo'))).toBe('foo')
    })
    it('should pass through other values', function () {
      expect(unwrapSafeString('foo')).toBe('foo')
      expect(unwrapSafeString(42)).toBe(42)
      expect(unwrapSafeString(undefined)).toBe(undefined)
    })
  })
  describe('.toSafeString()', function () {
    it('should wrap a plain string', function () {
      const str = toSafeString('foo')
      expect(isSafeString(str)).toBe(true)
      expect(str.toString()).toBe('foo')
    })
    it('should not wrap a SafeString twice', function () {
      const str = toSafeString('foo')
      expect(toSafeString(str)).toBe(str)
    })
    it('should stringify non-string values', function () {
      expect(toSafeString(42).toString()).toBe('42')
      expect(toSafeString(null).toString()).toBe('')
    })
  })
  describe('.concatSafeString()', function () {
    it('should concat two SafeStrings into a SafeString', function () {
      const result = concatSafeString(new SafeString('<b>'), new SafeString('&lt;'))
      expect(isSafeString(result)).toBe(true)
      expect(result.toString()).toBe('<b>&lt;')
    })
    it('should degrade to plain string if lhs is not safe', function () {
      const result = concatSafeString('<b>', new SafeString('&lt;'))
      expect(isSafeString(result)).toBe(false)
      expect(result).toBe('<b>&lt;')
    })
  })
})
