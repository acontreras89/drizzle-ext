import {
  Column,
  is,
  sql,
  type AnyColumn,
  type GetColumnData,
  type Placeholder,
  type SQL,
  type SQLWrapper,
} from 'drizzle-orm'
import { toOperand, type Input } from './lib'

/**
 * Comparison functions and operators.
 * @see https://www.postgresql.org/docs/current/functions-comparison.html
 */

/**
 * Test whether the value of a column or SQL expression falls between a minimum
 * and a maximum value.
 */
export function between<T>(
  expression: AnyColumn<{ data: T }>,
  min: NoInfer<Input<T>>,
  max: NoInfer<Input<T>>,
): SQL<boolean>

export function between<T>(
  expression: NoInfer<Input<T>>,
  min: AnyColumn<{ data: T }>,
  max: NoInfer<Input<T>>,
): SQL<boolean>

export function between<T>(
  expression: NoInfer<Input<T>>,
  min: NoInfer<Input<T>>,
  max: AnyColumn<{ data: T }>,
): SQL<boolean>

export function between(
  expression: unknown,
  min: unknown,
  max: unknown,
): SQL<boolean> {
  switch (true) {
    case is(expression, Column):
      min = toOperand(min, expression)
      max = toOperand(max, expression)
      break
    case is(min, Column):
      expression = toOperand(expression, min)
      max = toOperand(max, min)
      break
    case is(max, Column):
      expression = toOperand(expression, max)
      min = toOperand(min, max)
      break
  }

  return sql`${expression} between ${min} and ${max}`
}

/**
 * Test whether the value of a column or SQL expression falls outside a minimum
 * and a maximum value.
 */
export function notBetween<T>(
  expression: AnyColumn<{ data: T }>,
  min: NoInfer<Input<T>>,
  max: NoInfer<Input<T>>,
): SQL<boolean>

export function notBetween<T>(
  expression: NoInfer<Input<T>>,
  min: AnyColumn<{ data: T }>,
  max: NoInfer<Input<T>>,
): SQL<boolean>

export function notBetween<T>(
  expression: NoInfer<Input<T>>,
  min: NoInfer<Input<T>>,
  max: AnyColumn<{ data: T }>,
): SQL<boolean>

export function notBetween(
  expression: unknown,
  min: unknown,
  max: unknown,
): SQL<boolean> {
  switch (true) {
    case is(expression, Column):
      min = toOperand(min, expression)
      max = toOperand(max, expression)
      break
    case is(min, Column):
      expression = toOperand(expression, min)
      max = toOperand(max, min)
      break
    case is(max, Column):
      expression = toOperand(expression, max)
      min = toOperand(min, max)
      break
  }

  return sql`${expression} not between ${min} and ${max}`
}

// override return types of comparison functions and operators
declare module 'drizzle-orm' {
  // eq, ne, gt, gte, lt, and lte
  export interface BinaryOperator {
    <TColumn extends Column>(
      left: TColumn,
      right: GetColumnData<TColumn, 'raw'> | SQLWrapper,
    ): SQL<boolean>
    <T>(left: SQL.Aliased<T>, right: T | SQLWrapper): SQL<boolean>
    <T extends SQLWrapper>(
      left: Exclude<T, SQL.Aliased | Column>,
      right: unknown,
    ): SQL<boolean>
  }

  function not(condition: SQLWrapper): SQL<boolean>
  function isNull(value: SQLWrapper): SQL<boolean>
  function isNotNull(value: SQLWrapper): SQL<boolean>
  function exists(value: SQLWrapper): SQL<boolean>
  function notExists(value: SQLWrapper): SQL<boolean>
  function like(column: Column, value: string | SQLWrapper): SQL<boolean>
  function notLike(column: Column, value: string | SQLWrapper): SQL<boolean>
  function ilike(column: Column, value: string | SQLWrapper): SQL<boolean>
  function notIlike(column: Column, value: string | SQLWrapper): SQL<boolean>

  function inArray<T>(
    column: SQL.Aliased<T>,
    values: (T | Placeholder)[] | SQLWrapper,
  ): SQL<boolean>
  function inArray<TColumn extends Column>(
    column: TColumn,
    values: (GetColumnData<TColumn, 'raw'> | Placeholder)[] | SQLWrapper,
  ): SQL<boolean>
  function inArray<T extends SQLWrapper>(
    column: Exclude<T, SQL.Aliased | Column>,
    values: (unknown | Placeholder)[] | SQLWrapper,
  ): SQL<boolean>

  function notInArray<T>(
    column: SQL.Aliased<T>,
    values: (T | Placeholder)[] | SQLWrapper,
  ): SQL<boolean>
  function notInArray<TColumn extends Column>(
    column: TColumn,
    values: (GetColumnData<TColumn, 'raw'> | Placeholder)[] | SQLWrapper,
  ): SQL<boolean>
  function notInArray<T extends SQLWrapper>(
    column: Exclude<T, SQL.Aliased | Column>,
    values: (unknown | Placeholder)[] | SQLWrapper,
  ): SQL<boolean>

  // arrayContains, arrayContained, arrayOverlaps and others can be added as needed
}
