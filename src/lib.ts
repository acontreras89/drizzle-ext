import {
  Column,
  is,
  isSQLWrapper,
  Param,
  SQL,
  type AnyColumn,
  type DriverValueDecoder,
  type DriverValueEncoder,
  type GetColumnData,
  type SQLChunk,
} from 'drizzle-orm'

/**
 * The expression vocabulary.
 *
 * Drizzle values differ in two capabilities, and every type here is named
 * after the capabilities it guarantees:
 *
 * - **decodable**: it knows how to map a raw driver value back to a JS value
 *   (it has a {@link DriverValueDecoder}). `SQL`, `SQL.Aliased` and `Column`
 *   are decodable; `Param` is not — it only carries an *encoder*.
 * - **embeddable**: it can be interpolated into a ``sql`...` `` template.
 *   Everything above is embeddable, including `Param`.
 *
 * This gives a strict hierarchy — `Expression ⊂ Operand ⊂ Input`:
 *
 * | Type            | decodable | embeddable | raw JS values |
 * | --------------- | --------- | ---------- | ------------- |
 * | `Expression<T>` | yes       | yes        | no            |
 * | `Operand<T>`    | maybe     | yes        | no            |
 * | `Input<T>`      | maybe     | via {@link toOperand} | yes |
 *
 * Rule of thumb for helper signatures: take an `Expression` for the argument
 * that determines the helper's result (you will need its decoder and its
 * inferred type), take an `Input` for auxiliary arguments where literals are
 * ergonomic (delimiters, defaults, …) and convert with {@link toOperand}.
 * `Operand` mostly appears in return positions and internals.
 */

/**
 * A typed, decodable SQL expression: it can be embedded in a query *and* its
 * result can be mapped back from the driver ({@link getDecoder} is total on
 * this type). Use it whenever the argument's type or decoder flows into the
 * helper's result.
 * @note This is a more constrained version of drizzle's `SQLWrapper`. In
 * particular it excludes `Param`, which has no decoder.
 */
export type Expression<T = unknown> =
  SQL<T> | SQL.Aliased<T> | AnyColumn<{ data: T }>

/**
 * Anything that can be embedded into a SQL template: an {@link Expression} or
 * a `Param`. Not necessarily decodable — use it in embedding positions where
 * the value never flows back out of the database.
 */
export type Operand<T = unknown> = Expression<T> | Param<T, unknown>

/**
 * What ergonomic helper arguments accept: an {@link Operand} or a raw JS
 * value that will be bound as a parameter. Normalize with {@link toOperand}.
 */
export type Input<T = unknown> = Operand<T> | T

/**
 * Infer the JS type an {@link Expression} resolves to. For columns this is
 * nullability-aware (a nullable column infers `T | null`).
 */
export type InferData<T extends Expression> = T extends Column
  ? GetColumnData<T, 'query'>
  : T extends Expression<infer U>
    ? U
    : never

/**
 * Infer the tuple of JS types produced by a tuple of {@link Expression}s,
 * preserving positions (e.g. `[SQL<number>, Column<{data: string}>]` infers
 * `[number, string | null]`).
 */
export type InferDataTuple<T extends Expression[]> = {
  [K in keyof T]: InferData<T[K]>
}

/**
 * Get the driver value decoder of an expression. Total: every
 * {@link Expression} carries one (plain `sql` templates default to drizzle's
 * noop decoder).
 * @note `SQL#decoder` is not part of drizzle's public typings (it is assigned
 * by `mapWith` at runtime). This function is the only place allowed to reach
 * into it.
 */
export function getDecoder(
  expression: Expression,
): DriverValueDecoder<any, any> {
  if (is(expression, SQL)) {
    // @ts-expect-error `decoder` is internal to drizzle
    return expression.decoder
  }
  if (is(expression, SQL.Aliased)) {
    // @ts-expect-error `decoder` is internal to drizzle
    return expression.sql.decoder
  }
  if (is(expression, Column)) return expression
  return expression satisfies never
}

/**
 * Find the driver value encoder of an operand, if any. Columns and params
 * carry their own; complex `SQL` expressions are searched chunk by chunk
 * (depth-first, first match wins).
 */
export function findEncoder(
  operand: Operand,
): DriverValueEncoder<any, any> | undefined {
  if (is(operand, Column)) return operand
  if (is(operand, Param)) return operand.encoder
  if (is(operand, SQL)) return findEncoderInChunks(operand.queryChunks)
  if (is(operand, SQL.Aliased)) {
    return findEncoderInChunks(operand.sql.queryChunks)
  }
  return operand satisfies never
}

function findEncoderInChunks(
  chunks: SQLChunk[],
): DriverValueEncoder<unknown, unknown> | undefined {
  for (const chunk of chunks) {
    if (is(chunk, Column)) return chunk
    if (is(chunk, Param)) return chunk.encoder
    const nested = is(chunk, SQL)
      ? chunk.queryChunks
      : Array.isArray(chunk)
        ? chunk
        : undefined
    if (nested) {
      const encoder = findEncoderInChunks(nested)
      if (encoder) return encoder
    }
  }
  return undefined
}

/**
 * Normalize an {@link Input} into an {@link Operand}: operands pass through,
 * raw JS values are bound as a `Param` — with `encoder` when provided, so the
 * value is sent to the driver the same way the related column would be (use
 * {@link findEncoder} on a sibling operand to obtain one).
 * @note Based on drizzle's internal `bindIfParam`, but accepts a standalone
 * encoder instead of requiring a column, and keeps the value type `T`.
 */
export function toOperand<T>(
  input: Input<T>,
  encoder?: DriverValueEncoder<T, unknown>,
): Operand<T> {
  // `isSQLWrapper` is a duck check on `getSQL`, which every operand implements,
  // `Param` included; the manual cast is only needed because it narrows to
  // `Column` rather than to `Operand<T>`
  return isSQLWrapper(input)
    ? (input as Operand<T>)
    : new Param(input as T, encoder)
}
