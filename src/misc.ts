import type { DriverValueMapper } from 'drizzle-orm'

/**
 * A PostgreSQL driver value mapper for dates.
 */
export const psqlDateMapper: DriverValueMapper<Date, string> = {
  mapFromDriverValue: (value) => new Date(value),
  mapToDriverValue: (date) => date.toISOString(),
}
