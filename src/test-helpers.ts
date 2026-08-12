import type { SQL } from 'drizzle-orm'
import {
  integer,
  jsonb,
  PgDialect,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'
import { getDecoder, type Expression } from './lib'

/**
 * Test helpers. These assert on the SQL a helper builds, which is all that can
 * be checked without a live database — see the README on testing.
 */

const dialect = new PgDialect()

/** The table every test builds its expressions against. */
export const t = pgTable('t', {
  id: integer('id'),
  value: integer('value'),
  name: text('name'),
  createdAt: timestamp('created_at'),
  data: jsonb('data').$type<{ status: 'on' | 'off'; tags: string[] }>(),
})

/** Serialize a drizzle SQL expression to a plain SQL string (no params). */
export function toSQL(expression: SQL): string {
  return dialect.sqlToQuery(expression.inlineParams()).sql
}

/** Serialize a drizzle SQL expression, keeping its bound parameters. */
export function toQuery(expression: SQL): { sql: string; params: unknown[] } {
  const { sql, params } = dialect.sqlToQuery(expression)
  return { sql, params }
}

/**
 * Map a raw driver value through an expression's own decoder, the way the
 * driver would when the query comes back.
 */
export function decode(expression: Expression, value: unknown): unknown {
  return getDecoder(expression).mapFromDriverValue(value)
}
