import { sql, type SQL } from 'drizzle-orm'
import { getDecoder, type Expression, type Input } from './lib'

/**
 * Date/time functions and operators.
 * @see https://www.postgresql.org/docs/current/functions-datetime.html
 */

type Interval = {
  years?: Input<number>
  months?: Input<number>
  weeks?: Input<number>
  days?: Input<number>
  hours?: Input<number>
  mins?: Input<number>
  secs?: Input<number>
}

/**
 * Create interval from years, months, weeks, days, hours, minutes and seconds
 * fields, each of which can default to zero.
 */
export function makeInterval(interval: Interval = {}): SQL<string> {
  const expression = sql<string>`make_interval(`

  expression.append(
    sql.join(
      Object.entries(interval).map(([key, value]) =>
        sql.join([sql.raw(key), value], sql` => `),
      ),
      sql`, `,
    ),
  )

  return expression.append(sql`)`)
}

/**
 * Convert time stamp _without_ time zone to/from time stamp _with_ time zone.
 * @see https://www.postgresql.org/docs/current/functions-datetime.html#FUNCTIONS-DATETIME-ZONECONVERT
 */
export function atTimezone(
  expression: Expression<Date>,
  timezone: string,
): SQL<Date> {
  return sql`${expression} at time zone ${timezone}`
    .inlineParams()
    .mapWith(getDecoder(expression))
}
