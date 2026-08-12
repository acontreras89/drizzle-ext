import { arrayOverlaps, sql, type SQL } from 'drizzle-orm'
import { cast } from './datatypes'
import { toOperand, type Expression, type Input } from './lib'
import { psqlDateMapper } from './misc'

/**
 * Range types.
 * @see https://www.postgresql.org/docs/current/rangetypes.html
 */

/**
 * The JS representation a `daterange` decodes into.
 */
export type DateRange = { from: Date; to: Date }

function dateRangeMapper(value: string): DateRange {
  const [from, to] = value
    .slice(1, -1)
    .split(',')
    .map((v) => (v ? new Date(v) : null))

  if (!from || !to) throw new Error(`Invalid date range ${value}`)

  return { from, to }
}

/**
 * Construct a `daterange` from two dates or SQL expressions resulting in dates.
 */
export function dateRange(
  from: Expression<Date>,
  to: Expression<Date>,
): SQL<DateRange> {
  return sql<DateRange>`daterange(${cast.date(from)}, ${cast.date(to)})`.mapWith(
    dateRangeMapper,
  )
}

/**
 * Construct a `tsrange` from two dates or SQL expressions resulting in dates.
 */
export function tsrange(
  from: Input<Date>,
  to: Input<Date>,
  bounds?: '[]' | '[)' | '(]' | '()',
): SQL {
  from = toOperand(from, psqlDateMapper)
  to = toOperand(to, psqlDateMapper)

  return bounds
    ? sql`tsrange(${from}, ${to}, ${bounds})`
    : sql`tsrange(${from}, ${to})`
}

/**
 * Range/multirange functions and operators.
 * @see https://www.postgresql.org/docs/current/functions-range.html
 */

/**
 * Test that two ranges overlap.
 * @note In PostgreSQL, the range overlap operator `&&` is the same as the array
 * overlap operator.
 */
export const rangeOverlaps = arrayOverlaps
