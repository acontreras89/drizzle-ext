import { asc, desc, gt } from 'drizzle-orm'
import {
  arrayAgg,
  arrayAggDistinct,
  avg,
  count,
  countDistinct,
  jsonAgg,
  jsonAggDistinct,
  jsonbAgg,
  jsonbAggDistinct,
  stringAgg,
  stringAggDistinct,
  sum,
} from './aggregate'
import { t, toSQL } from './test-helpers'

describe('aggregate functions', () => {
  describe('sum', () => {
    it('produces sum(col)', () => {
      expect(toSQL(sum(t.value))).toBe('sum("t"."value")')
    })
  })

  describe('avg', () => {
    it('produces avg(col)', () => {
      expect(toSQL(avg(t.value))).toBe('avg("t"."value")')
    })
  })

  describe('count', () => {
    it('produces count(*) by default', () => {
      expect(toSQL(count())).toBe('count(*)')
    })

    it('produces count(col)', () => {
      expect(toSQL(count(t.id))).toBe('count("t"."id")')
    })
  })

  describe('countDistinct', () => {
    it('produces count(distinct col)', () => {
      expect(toSQL(countDistinct(t.id))).toBe('count(distinct "t"."id")')
    })
  })

  describe('stringAgg', () => {
    it('produces string_agg(col, delimiter)', () => {
      expect(toSQL(stringAgg(t.name, ', '))).toBe(
        'string_agg("t"."name", \', \')',
      )
    })
  })

  describe('stringAggDistinct', () => {
    it('produces string_agg(distinct col, delimiter)', () => {
      expect(toSQL(stringAggDistinct(t.name, ', '))).toBe(
        'string_agg(distinct "t"."name", \', \')',
      )
    })
  })

  describe('arrayAgg', () => {
    it('produces array_agg(col, delimiter)', () => {
      expect(toSQL(arrayAgg(t.name))).toBe('array_agg("t"."name")')
    })
  })

  describe('arrayAggDistinct', () => {
    it('produces array_agg(distinct col, delimiter)', () => {
      expect(toSQL(arrayAggDistinct(t.name))).toBe(
        'array_agg(distinct "t"."name")',
      )
    })
  })

  describe('jsonAgg', () => {
    it('produces json_agg(col)', () => {
      expect(toSQL(jsonAgg(t.id))).toBe('json_agg("t"."id")')
    })
  })

  describe('jsonAggDistinct', () => {
    it('produces json_agg(distinct col)', () => {
      expect(toSQL(jsonAggDistinct(t.id))).toBe('json_agg(distinct "t"."id")')
    })
  })

  describe('jsonbAgg', () => {
    it('produces jsonb_agg(col)', () => {
      expect(toSQL(jsonbAgg(t.id))).toBe('jsonb_agg("t"."id")')
    })
  })

  describe('jsonbAggDistinct', () => {
    it('produces jsonb_agg(distinct col)', () => {
      expect(toSQL(jsonbAggDistinct(t.id))).toBe('jsonb_agg(distinct "t"."id")')
    })
  })

  describe('orderBy', () => {
    it('places ORDER BY inside the aggregate parentheses', () => {
      expect(toSQL(jsonAgg(t.id).orderBy(t.value))).toBe(
        'json_agg("t"."id" order by "t"."value")',
      )
    })

    it('supports multiple ORDER BY columns', () => {
      expect(toSQL(jsonAgg(t.id).orderBy(t.value, t.name))).toBe(
        'json_agg("t"."id" order by "t"."value", "t"."name")',
      )
    })

    it('supports asc/desc ordering', () => {
      expect(toSQL(jsonAgg(t.id).orderBy(asc(t.value), desc(t.name)))).toBe(
        'json_agg("t"."id" order by "t"."value" asc, "t"."name" desc)',
      )
    })

    it('works on non-json aggregates', () => {
      expect(toSQL(sum(t.value).orderBy(t.id))).toBe(
        'sum("t"."value" order by "t"."id")',
      )
    })

    it('works with distinct (orderBy after distinct expression)', () => {
      expect(toSQL(jsonAggDistinct(t.id).orderBy(t.value))).toBe(
        'json_agg(distinct "t"."id" order by "t"."value")',
      )
    })
  })

  describe('filterWhere', () => {
    it('appends FILTER (WHERE ...) after the closing paren', () => {
      expect(toSQL(count(t.id).filterWhere(gt(t.value, 0)))).toBe(
        'count("t"."id") filter (where "t"."value" > 0)',
      )
    })
  })

  describe('orderBy + filterWhere combined', () => {
    it('places ORDER BY inside parens and FILTER outside', () => {
      expect(
        toSQL(jsonAgg(t.id).orderBy(t.value).filterWhere(gt(t.value, 0))),
      ).toBe(
        'json_agg("t"."id" order by "t"."value") filter (where "t"."value" > 0)',
      )
    })
  })
})
