import { sql } from 'drizzle-orm'
import { coalesce } from './conditional'
import { decode, t, toQuery, toSQL } from './test-helpers'

describe('conditional expressions', () => {
  describe('coalesce', () => {
    it('produces coalesce(col, default)', () => {
      expect(toSQL(coalesce(t.value, 0))).toBe('coalesce("t"."value", 0)')
    })

    it('binds the default value as a parameter', () => {
      expect(toQuery(coalesce(t.value, 0))).toEqual({
        sql: 'coalesce("t"."value", $1)',
        params: [0],
      })
    })

    it('accepts another column as the default', () => {
      expect(toSQL(coalesce(t.value, t.id))).toBe(
        'coalesce("t"."value", "t"."id")',
      )
    })

    it('keeps the decoder of the coalesced expression', () => {
      const expression = coalesce(sql<number>`1`.mapWith(Number), 0)
      expect(decode(expression, '42')).toBe(42)
    })
  })
})
