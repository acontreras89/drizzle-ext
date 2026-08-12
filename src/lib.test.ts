import { Param, sql } from 'drizzle-orm'
import { findEncoder, getDecoder, toOperand } from './lib'
import { psqlDateMapper } from './misc'
import { t, toQuery } from './test-helpers'

describe('expression vocabulary', () => {
  describe('getDecoder', () => {
    it('returns the column itself for a column', () => {
      expect(getDecoder(t.createdAt)).toBe(t.createdAt)
    })

    it('returns the decoder assigned by mapWith', () => {
      expect(getDecoder(sql`1`.mapWith(Number)).mapFromDriverValue('42')).toBe(
        42,
      )
    })

    it('falls back to a noop decoder for a plain template', () => {
      expect(getDecoder(sql`1`).mapFromDriverValue('42')).toBe('42')
    })

    it('reaches through an alias', () => {
      const aliased = sql`1`.mapWith(Number).as('n')
      expect(getDecoder(aliased).mapFromDriverValue('42')).toBe(42)
    })
  })

  describe('findEncoder', () => {
    it('returns the column itself for a column', () => {
      expect(findEncoder(t.createdAt)).toBe(t.createdAt)
    })

    it('returns the encoder of a param', () => {
      expect(findEncoder(new Param(new Date(), psqlDateMapper))).toBe(
        psqlDateMapper,
      )
    })

    it('finds a column nested in a template', () => {
      expect(findEncoder(sql`${t.value} + 1`)).toBe(t.value)
    })

    it('descends into nested templates', () => {
      expect(findEncoder(sql`(${sql`${t.value}`})`)).toBe(t.value)
    })

    it('returns undefined when there is no encoder to find', () => {
      expect(findEncoder(sql`1`)).toBeUndefined()
    })
  })

  describe('toOperand', () => {
    it('binds a raw value as a parameter, encoded by the given encoder', () => {
      const operand = toOperand(new Date('2026-08-12'), psqlDateMapper)
      expect(toQuery(sql`${operand}`).params).toEqual([
        '2026-08-12T00:00:00.000Z',
      ])
    })

    it('binds a raw value with no encoder as-is', () => {
      expect(toQuery(sql`${toOperand(42)}`).params).toEqual([42])
    })

    it('passes a param through untouched', () => {
      const param = new Param(1)
      expect(toOperand(param)).toBe(param)
    })

    it('passes a column through untouched', () => {
      expect(toOperand(t.value)).toBe(t.value)
    })

    it('passes an expression through untouched', () => {
      const expression = sql`1`
      expect(toOperand(expression)).toBe(expression)
    })
  })
})
