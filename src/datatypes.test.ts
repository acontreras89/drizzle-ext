import { cast, row } from './datatypes'
import { decode, t, toSQL } from './test-helpers'

describe('data types', () => {
  describe('cast', () => {
    it('casts to integer', () => {
      expect(toSQL(cast.integer(t.name))).toBe('"t"."name"::integer')
    })

    it('aliases int and int4 to integer', () => {
      expect(cast.int).toBe(cast.integer)
      expect(cast.int4).toBe(cast.integer)
    })

    it('casts to date', () => {
      expect(toSQL(cast.date(t.createdAt))).toBe(
        'cast("t"."created_at" as date)',
      )
    })

    it('decodes a cast date into a Date', () => {
      expect(decode(cast.date(t.createdAt), '2026-08-12')).toEqual(
        new Date('2026-08-12'),
      )
    })
  })

  describe('row', () => {
    it('produces a parenthesized, comma separated composite', () => {
      expect(toSQL(row(t.id, t.name))).toBe('("t"."id", "t"."name")')
    })

    it('decodes a composite into a tuple, position by position', () => {
      expect(decode(row(t.id, t.name), '(1,foo)')).toEqual([1, 'foo'])
    })

    it('decodes empty fields as null', () => {
      expect(decode(row(t.id, t.name), '(1,)')).toEqual([1, null])
    })

    it('unescapes quoted fields', () => {
      expect(decode(row(t.id, t.name), '(1,"foo")')).toEqual([1, 'foo'])
    })

    it('keeps commas inside a quoted field', () => {
      expect(decode(row(t.id, t.name), '(1,"foo,bar")')).toEqual([1, 'foo,bar'])
    })

    it('decodes a doubled quote as a single one', () => {
      expect(decode(row(t.id, t.name), '(1,"say ""hi""")')).toEqual([
        1,
        'say "hi"',
      ])
    })

    it('decodes a backslash-escaped quote', () => {
      expect(decode(row(t.id, t.name), '(1,"say \\"hi\\"")')).toEqual([
        1,
        'say "hi"',
      ])
    })

    it('decodes a backslash-escaped backslash', () => {
      expect(decode(row(t.id, t.name), '(1,"a\\\\b")')).toEqual([1, 'a\\b'])
    })

    it('distinguishes a quoted empty string from null', () => {
      expect(decode(row(t.name, t.name), '("",)')).toEqual(['', null])
    })

    it('keeps parentheses inside a quoted field', () => {
      expect(decode(row(t.id, t.name), '(1,"(a,b)")')).toEqual([1, '(a,b)'])
    })

    it('throws when the composite does not match the expressions', () => {
      expect(() => decode(row(t.id, t.name), '(1,foo,bar)')).toThrow(
        'Expected 2 fields in composite value, got 3',
      )
    })
  })
})
