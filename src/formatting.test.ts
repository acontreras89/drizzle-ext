import { toChar } from './formatting'
import { t, toQuery, toSQL } from './test-helpers'

describe('formatting functions', () => {
  describe('toChar', () => {
    it('produces to_char(col, format)', () => {
      expect(toSQL(toChar(t.createdAt, 'YYYY-MM-DD'))).toBe(
        `to_char("t"."created_at", 'YYYY-MM-DD')`,
      )
    })

    it('inlines the format instead of binding it as a parameter', () => {
      expect(toQuery(toChar(t.createdAt, 'YYYY-MM-DD'))).toEqual({
        sql: `to_char("t"."created_at", 'YYYY-MM-DD')`,
        params: [],
      })
    })
  })
})
