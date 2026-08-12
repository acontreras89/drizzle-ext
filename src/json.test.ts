import { extractText, jsonBuildObject, jsonbBuildObject } from './json'
import { decode, t, toSQL } from './test-helpers'

describe('JSON functions', () => {
  describe('extractText', () => {
    it('extracts an object property as text', () => {
      expect(toSQL(extractText(t.data, 'status'))).toBe(`"t"."data"->>'status'`)
    })
  })

  describe('jsonBuildObject', () => {
    it('produces json_build_object with key/value pairs', () => {
      expect(toSQL(jsonBuildObject({ id: t.id, name: t.name }))).toBe(
        `json_build_object('id', "t"."id", 'name', "t"."name")`,
      )
    })

    it('decodes each value with its own decoder', () => {
      const expression = jsonBuildObject({ createdAt: t.createdAt })
      expect(decode(expression, { createdAt: '2026-08-12 00:00:00' })).toEqual({
        createdAt: new Date('2026-08-12T00:00:00.000Z'),
      })
    })

    it('leaves null values alone', () => {
      const expression = jsonBuildObject({ createdAt: t.createdAt })
      expect(decode(expression, { createdAt: null })).toEqual({
        createdAt: null,
      })
    })
  })

  describe('jsonbBuildObject', () => {
    it('produces jsonb_build_object with key/value pairs', () => {
      expect(toSQL(jsonbBuildObject({ id: t.id }))).toBe(
        `jsonb_build_object('id', "t"."id")`,
      )
    })
  })
})
