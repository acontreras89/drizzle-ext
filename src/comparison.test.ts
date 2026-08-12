import { between, notBetween } from './comparison'
import { t, toQuery, toSQL } from './test-helpers'

describe('comparison operators', () => {
  describe('between', () => {
    it('produces col between min and max', () => {
      expect(toSQL(between(t.value, 1, 10))).toBe(
        '"t"."value" between 1 and 10',
      )
    })

    it('binds the bounds as parameters', () => {
      expect(toQuery(between(t.value, 1, 10))).toEqual({
        sql: '"t"."value" between $1 and $2',
        params: [1, 10],
      })
    })

    it('binds against the column when it is the minimum', () => {
      expect(toQuery(between(1, t.value, 10))).toEqual({
        sql: '$1 between "t"."value" and $2',
        params: [1, 10],
      })
    })

    it('binds against the column when it is the maximum', () => {
      expect(toQuery(between(1, 10, t.value))).toEqual({
        sql: '$1 between $2 and "t"."value"',
        params: [1, 10],
      })
    })

    it('leaves expressions untouched', () => {
      expect(toSQL(between(t.value, t.id, t.value))).toBe(
        '"t"."value" between "t"."id" and "t"."value"',
      )
    })
  })

  describe('notBetween', () => {
    it('produces col not between min and max', () => {
      expect(toSQL(notBetween(t.value, 1, 10))).toBe(
        '"t"."value" not between 1 and 10',
      )
    })

    it('binds the bounds as parameters', () => {
      expect(toQuery(notBetween(t.value, 1, 10))).toEqual({
        sql: '"t"."value" not between $1 and $2',
        params: [1, 10],
      })
    })
  })
})
