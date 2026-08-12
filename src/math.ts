import {
  sql,
  type AnyColumn,
  type Column,
  type SQL,
  type SQLWrapper,
} from 'drizzle-orm'
import type { Expression } from './lib'

/**
 * Mathematical functions and operators.
 * @see https://www.postgresql.org/docs/current/functions-math.html
 */

/**
 * Rounds to nearest integer or to the specified number of decimal places.
 */
export function round(
  expression: AnyColumn<{ data: number }>,
  decimalPlaces?: number,
): SQL<number | null>

// explicit type overload
export function round<T extends number>(
  expression: AnyColumn<{ data: T }>,
  decimalPlaces?: number,
): SQL<T>

export function round(
  expression: Exclude<Expression<number>, Column>,
  decimalPlaces?: number,
): SQL<number>

export function round(expression: SQLWrapper, decimalPlaces?: number): SQL {
  return decimalPlaces
    ? sql`round(${expression}, ${decimalPlaces})`.mapWith(Number)
    : sql`round(${expression})`.mapWith(Number)
}
