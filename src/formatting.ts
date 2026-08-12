import { sql, type SQL } from 'drizzle-orm'
import type { Expression } from './lib'

/**
 * Data type formatting functions.
 * @see https://www.postgresql.org/docs/current/functions-formatting.html
 */

export function toChar(
  expression: Expression<Date>,
  format: string,
): SQL<string> {
  return sql<string>`to_char(${expression}, ${format})`.inlineParams()
}
