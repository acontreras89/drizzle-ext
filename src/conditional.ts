import { sql, type AnyColumn, type Column, type SQL } from 'drizzle-orm'
import {
  findEncoder,
  getDecoder,
  toOperand,
  type Expression,
  type Input,
} from './lib'

/**
 * Conditional expressions.
 * @see https://www.postgresql.org/docs/current/functions-conditional.html
 */

/**
 * Coalesce a column or SQL expression to default value when it results in null.
 * @see https://www.postgresql.org/docs/current/functions-conditional.html#FUNCTIONS-COALESCE-NVL-IFNULL
 */
export function coalesce<T, C extends AnyColumn<{ data: T }>>(
  expression: Expression<T>,
  defaultValue: C,
): SQL<T | null>

// explicit type overload
export function coalesce<T>(
  expression: Expression<T>,
  defaultValue: AnyColumn<{ data: T }>,
): SQL<T>

export function coalesce<T>(
  expression: Expression<T | null>,
  defaultValue: Exclude<Expression<T>, Column> | T,
): SQL<T>

export function coalesce<T>(
  expression: Expression<T | null>,
  defaultValue: Input<T>,
): SQL<T> {
  const decoder = getDecoder(expression)
  const encoder = findEncoder(expression)

  defaultValue = toOperand(defaultValue, encoder)

  return sql`coalesce(${expression}, ${defaultValue})`.mapWith(decoder)
}
