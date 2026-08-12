import { sql, type DriverValueDecoder, type SQL } from 'drizzle-orm'
import { getDecoder, type Expression, type InferDataTuple } from './lib'
import { psqlDateMapper } from './misc'

/**
 * Data types.
 * @see https://www.postgresql.org/docs/current/datatype.html
 */

/**
 * Cast any expression to a signed four-byte integer.
 */
function integer(expression: Expression): SQL<number> {
  return sql<number>`${expression}::integer`
}

/**
 * Cast any expression to a calendar date (year, month, day).
 */
function date(expression: Expression): SQL<Date> {
  return sql<Date>`cast(${expression} as date)`.mapWith(psqlDateMapper)
}

/**
 * Type casts. A type cast specifies a conversion from one data type to another.
 * @see https://www.postgresql.org/docs/current/sql-expressions.html#SQL-SYNTAX-TYPE-CASTS
 */
export const cast = {
  integer,
  int: integer,
  int4: integer,
  date,
}

/**
 * Composite types.
 * @see https://www.postgresql.org/docs/current/rowtypes.html
 */

/**
 * Build an anonymous composite value (a row) out of several expressions. The
 * result decodes back into a tuple, position by position.
 */
export function row<T extends Expression[]>(
  ...expressions: T
): SQL<InferDataTuple<T>> {
  return sql`(${sql.join(expressions, sql.raw(', '))})`.mapWith(
    rowMapper(...expressions.map(getDecoder)),
  ) as SQL<InferDataTuple<T>>
}

/** @internal */
function rowMapper(...mappers: DriverValueDecoder<unknown, unknown>[]) {
  return (value: string) => {
    const fields = parseRow(value)

    if (fields.length !== mappers.length) {
      throw new Error(
        `Expected ${mappers.length} fields in composite value, got ${fields.length}: ${value}`,
      )
    }

    return fields.map((field, i) =>
      field === null ? null : mappers[i]!.mapFromDriverValue(field),
    )
  }
}

/**
 * Split the composite value PostgreSQL emits — `(a,b,c)` — into its raw fields.
 * A field is quoted whenever it would otherwise be ambiguous, and inside those
 * quotes both `"` and `\` are escaped with a backslash or by doubling. An
 * unquoted empty field is null; a quoted one is the empty string.
 * @internal
 */
function parseRow(value: string): (string | null)[] {
  const fields: (string | null)[] = []
  const body = value.slice(1, -1)

  let field = ''
  let quoted = false
  // tracks null vs the empty string, which are indistinguishable by content
  let empty = true

  for (let i = 0; i < body.length; i++) {
    const char = body[i]!

    if (quoted) {
      if (char === '\\') field += body[++i] ?? ''
      else if (char !== '"') field += char
      else if (body[i + 1] === '"') field += body[++i]!
      else quoted = false
    } else if (char === '"') {
      quoted = true
      empty = false
    } else if (char === ',') {
      fields.push(empty ? null : field)
      field = ''
      empty = true
    } else {
      field += char
      empty = false
    }
  }
  fields.push(empty ? null : field)

  return fields
}
