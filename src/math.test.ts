import { round } from './math'
import { decode, t, toSQL } from './test-helpers'

describe('mathematical functions', () => {
  describe('round', () => {
    it('produces round(col)', () => {
      expect(toSQL(round(t.value))).toBe('round("t"."value")')
    })

    it('produces round(col, decimalPlaces)', () => {
      expect(toSQL(round(t.value, 2))).toBe('round("t"."value", 2)')
    })

    it('maps the result with Number', () => {
      expect(decode(round(t.value), '1.5')).toBe(1.5)
    })
  })
})
