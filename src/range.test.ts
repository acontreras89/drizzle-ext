import { dateRange, tsrange } from './range'
import { decode, t, toQuery, toSQL } from './test-helpers'

describe('range types', () => {
  describe('dateRange', () => {
    it('produces daterange(from, to), casting both bounds', () => {
      expect(toSQL(dateRange(t.createdAt, t.createdAt))).toBe(
        'daterange(cast("t"."created_at" as date), cast("t"."created_at" as date))',
      )
    })

    it('decodes a range into its two dates', () => {
      expect(
        decode(dateRange(t.createdAt, t.createdAt), '[2026-08-01,2026-08-12)'),
      ).toEqual({ from: new Date('2026-08-01'), to: new Date('2026-08-12') })
    })

    it('rejects a range with an open bound', () => {
      expect(() =>
        decode(dateRange(t.createdAt, t.createdAt), '[2026-08-01,)'),
      ).toThrow('Invalid date range')
    })
  })

  describe('tsrange', () => {
    it('binds raw dates as ISO string parameters', () => {
      expect(
        toQuery(tsrange(new Date('2026-08-01'), new Date('2026-08-12'))),
      ).toEqual({
        sql: 'tsrange($1, $2)',
        params: ['2026-08-01T00:00:00.000Z', '2026-08-12T00:00:00.000Z'],
      })
    })

    it('appends the bounds when given', () => {
      expect(
        toSQL(tsrange(new Date('2026-08-01'), new Date('2026-08-12'), '[)')),
      ).toBe(
        `tsrange('2026-08-01T00:00:00.000Z', '2026-08-12T00:00:00.000Z', '[)')`,
      )
    })

    it('accepts expressions instead of raw dates', () => {
      expect(toSQL(tsrange(t.createdAt, t.createdAt))).toBe(
        'tsrange("t"."created_at", "t"."created_at")',
      )
    })
  })
})
