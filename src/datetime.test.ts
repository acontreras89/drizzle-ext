import { atTimezone, makeInterval } from './datetime'
import { decode, t, toSQL } from './test-helpers'

describe('date/time functions', () => {
  describe('makeInterval', () => {
    it('produces make_interval() with no fields', () => {
      expect(toSQL(makeInterval())).toBe('make_interval()')
    })

    it('produces a single named field', () => {
      expect(toSQL(makeInterval({ days: 1 }))).toBe('make_interval(days => 1)')
    })

    it('produces every field it is given, in order', () => {
      expect(toSQL(makeInterval({ years: 1, mins: 30 }))).toBe(
        'make_interval(years => 1, mins => 30)',
      )
    })

    it('accepts expressions as field values', () => {
      expect(toSQL(makeInterval({ days: t.value }))).toBe(
        'make_interval(days => "t"."value")',
      )
    })
  })

  describe('atTimezone', () => {
    it('produces col at time zone tz', () => {
      expect(toSQL(atTimezone(t.createdAt, 'UTC'))).toBe(
        `"t"."created_at" at time zone 'UTC'`,
      )
    })

    it('keeps the decoder of the expression', () => {
      expect(
        decode(atTimezone(t.createdAt, 'UTC'), '2026-08-12 00:00:00'),
      ).toEqual(new Date('2026-08-12T00:00:00.000Z'))
    })
  })
})
