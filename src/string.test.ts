import { md5, trim } from './string'
import { t, toSQL } from './test-helpers'

describe('string functions', () => {
  describe('trim', () => {
    it('produces trim(col)', () => {
      expect(toSQL(trim(t.name))).toBe('trim("t"."name")')
    })

    it('produces trim(characters from col)', () => {
      expect(toSQL(trim(t.name, 'x'))).toBe(`trim('x' from "t"."name")`)
    })

    it('produces trim(position from col)', () => {
      expect(toSQL(trim(t.name, undefined, 'leading'))).toBe(
        'trim(leading "t"."name")',
      )
    })

    it('produces trim(position characters from col)', () => {
      expect(toSQL(trim(t.name, 'x', 'trailing'))).toBe(
        `trim(trailing 'x' from "t"."name")`,
      )
    })
  })

  describe('md5', () => {
    it('produces md5(col)', () => {
      expect(toSQL(md5(t.name))).toBe('md5("t"."name")')
    })
  })
})
