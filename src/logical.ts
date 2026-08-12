import type { SQL, SQLWrapper } from 'drizzle-orm'

/**
 * Logical operators.
 * @see https://www.postgresql.org/docs/current/functions-logical.html
 */

// override return types of logical operators
declare module 'drizzle-orm' {
  function and(...conditions: SQLWrapper[]): SQL<boolean>
  function and(
    ...conditions: (SQLWrapper | undefined)[]
  ): SQL<boolean> | undefined

  function or(...conditions: SQLWrapper[]): SQL<boolean>
  function or(
    ...conditions: (SQLWrapper | undefined)[]
  ): SQL<boolean> | undefined

  function not(condition: SQLWrapper): SQL<boolean>
}
