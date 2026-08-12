import {
  SQL,
  sql,
  StringChunk,
  type AnyColumn,
  type Column,
  type DriverValueDecoder,
  type GetDecoderResult,
  type SQLChunk,
  type SQLWrapper,
} from 'drizzle-orm'
import { parsePgArray } from 'drizzle-orm/pg-core'
import { row } from './datatypes'
import {
  getDecoder,
  type Expression,
  type InferData,
  type InferDataTuple,
  type Input,
} from './lib'

/**
 * Aggregate functions.
 * @see https://www.postgresql.org/docs/current/functions-aggregate.html
 * @see https://www.postgresql.org/docs/current/sql-expressions.html#SYNTAX-AGGREGATES
 */

class AggregateFunction<T> extends SQL<T> {
  readonly #orderBySlot: number

  constructor(name: string, expression: SQLWrapper, distinct?: boolean) {
    const queryChunks: SQLChunk[] = []
    queryChunks.push(new StringChunk(name))
    queryChunks.push(new StringChunk('('))
    if (distinct) queryChunks.push(new StringChunk('distinct '))
    queryChunks.push(expression)
    const closingParenIndex = queryChunks.length
    queryChunks.push(new StringChunk(')'))
    super(queryChunks)
    this.#orderBySlot = closingParenIndex
  }

  orderBy(...columns: Expression[]) {
    const orderByChunk = sql` order by ${sql.join(columns, sql.raw(', '))}`
    this.queryChunks.splice(this.#orderBySlot, 0, orderByChunk)
    return this
  }

  filterWhere(condition: Expression<boolean>) {
    this.append(sql` filter (where ${condition})`)
    return this
  }

  override mapWith<
    TDecoder extends
      | DriverValueDecoder<any, any>
      | DriverValueDecoder<any, any>['mapFromDriverValue'],
  >(decoder: TDecoder): AggregateFunction<GetDecoderResult<TDecoder>> {
    return super.mapWith(decoder) as AggregateFunction<
      GetDecoderResult<TDecoder>
    >
  }
}

/**
 * Computes the sum of the non-null input values.
 */
export function sum(
  expression: AnyColumn<{ data: number }>,
): AggregateFunction<number | null>

// explicit type overload
export function sum<T extends number>(
  expression: AnyColumn<{ data: T }>,
): AggregateFunction<T>

export function sum(
  expression: Exclude<Expression<number>, Column>,
): AggregateFunction<number>

export function sum(expression: SQLWrapper) {
  return new AggregateFunction('sum', expression).mapWith(Number)
}

/**
 * Computes the average (arithmetic mean) of all the non-null input values.
 */
export function avg(
  expression: AnyColumn<{ data: number }>,
): AggregateFunction<number | null>

// explicit type overload
export function avg<T extends number>(
  expression: AnyColumn<{ data: T }>,
): AggregateFunction<T>

export function avg(
  expression: Exclude<Expression<number>, Column>,
): AggregateFunction<number>

export function avg(expression: SQLWrapper) {
  return new AggregateFunction('avg', expression).mapWith(Number)
}

/**
 * Computes the number of input rows (without argument) or the number of input
 * rows in which the input value is not null.
 */
export function count(
  expression: SQLWrapper = sql.raw('*'),
): AggregateFunction<number> {
  return new AggregateFunction('count', expression).mapWith(Number)
}

/**
 * Computes the number of distinct values in a group.
 */
export function countDistinct(
  expression: SQLWrapper,
): AggregateFunction<number> {
  return new AggregateFunction('count', expression, true).mapWith(Number)
}

/**
 * Concatenates the non-null input values into a string. Each value after the
 * first is preceded by the corresponding delimiter (if it's not null).
 */
export function stringAgg(
  expression: Expression<string>,
  delimiter: Input<string>,
): AggregateFunction<string> {
  return new AggregateFunction(
    'string_agg',
    sql`${expression}, ${delimiter}`.inlineParams(),
  )
}

/**
 * Concatenates the distinct, non-null input values into a string. Each value
 * after the first is preceded by the corresponding delimiter (if it's not null).
 */
export function stringAggDistinct(
  expression: Expression<string>,
  delimiter: Input<string>,
): AggregateFunction<string> {
  return new AggregateFunction(
    'string_agg',
    sql`${expression}, ${delimiter}`.inlineParams(),
    true,
  )
}

/**
 * Collects all the input values, including nulls, into an array.
 */
export function arrayAgg<T extends Expression>(
  expression: T,
): AggregateFunction<Array<InferData<T>>>

export function arrayAgg<T extends Expression[]>(
  ...expressions: T
): AggregateFunction<InferDataTuple<T>>

export function arrayAgg(...expressions: Expression[]) {
  const expression =
    expressions.length === 1 ? expressions.at(0)! : row(...expressions)

  return new AggregateFunction('array_agg', expression).mapWith(
    arrayMapper(wrapDecoder(getDecoder(expression))),
  )
}

/**
 * Collects all the distinct input values, including nulls, into an array.
 */
export function arrayAggDistinct<T extends Expression>(
  expression: T,
): AggregateFunction<Array<InferData<T>>>

export function arrayAggDistinct<T extends Expression[]>(
  ...expressions: T
): AggregateFunction<InferDataTuple<T>>

export function arrayAggDistinct(...expressions: Expression[]) {
  const expression =
    expressions.length === 1 ? expressions.at(0)! : row(...expressions)

  return new AggregateFunction('array_agg', expression, true).mapWith(
    arrayMapper(wrapDecoder(getDecoder(expression))),
  )
}

/**
 * Wrap a decoder to handle first handle 'NULL' values. This is needed in some
 * rare cases where the postgres driver does not properly handle them, for
 * instance in the result of `array_agg`.
 * @see https://github.com/porsager/postgres/issues/1124
 * @internal
 */
const wrapDecoder = (
  decoder: DriverValueDecoder<unknown, unknown>,
): DriverValueDecoder<unknown, unknown> => ({
  mapFromDriverValue: (value) =>
    value === 'NULL' ? null : decoder.mapFromDriverValue(value),
})

/**
 * Collects all the input values, including nulls, into a JSON array.
 */
export function jsonAgg<T extends Expression>(
  expression: T,
): AggregateFunction<Array<InferData<T>>>

export function jsonAgg(expression: Expression) {
  return new AggregateFunction('json_agg', expression).mapWith(
    arrayMapper(getDecoder(expression)),
  )
}

/**
 * Collects all the distinct input values, including nulls, into a JSON array.
 */
export function jsonAggDistinct<T extends Expression>(
  expression: T,
): AggregateFunction<Array<InferData<T>>>

export function jsonAggDistinct(expression: Expression) {
  return new AggregateFunction('json_agg', expression, true).mapWith(
    arrayMapper(getDecoder(expression)),
  )
}

/**
 * Collects all the input values, including nulls, into a JSON array.
 */
export function jsonbAgg<T extends Expression>(
  expression: T,
): AggregateFunction<Array<InferData<T>>>

export function jsonbAgg(expression: Expression) {
  return new AggregateFunction('jsonb_agg', expression).mapWith(
    arrayMapper(getDecoder(expression)),
  )
}

/**
 * Collects all the distinct input values, including nulls, into a JSONB array.
 */
export function jsonbAggDistinct<T extends Expression>(
  expression: T,
): AggregateFunction<Array<InferData<T>>>

export function jsonbAggDistinct(expression: Expression) {
  return new AggregateFunction('jsonb_agg', expression, true).mapWith(
    arrayMapper(getDecoder(expression)),
  )
}

/** @internal */
function arrayMapper(mapper: DriverValueDecoder<unknown, unknown>) {
  return (value: Array<unknown> | string) => {
    if (typeof value === 'string') value = parsePgArray(value)
    return value.map(mapper.mapFromDriverValue)
  }
}
