import { sql, type SQL, type SQLChunk } from 'drizzle-orm'
import type { Expression } from './lib'

/**
 * String functions and operators.
 * @see https://www.postgresql.org/docs/current/functions-string.html
 */

/**
 * Removes the longest string containing only characters in characters (a space
 * by default) from the start, end, or both ends (BOTH is the default) of string.
 */
export function trim(
  string: Expression<string>,
  characters?: string,
  position?: 'both' | 'leading' | 'trailing',
): SQL<string> {
  const queryChunks: SQLChunk[] = []
  if (position) queryChunks.push(sql.raw(position))
  if (characters) {
    queryChunks.push(sql`${characters}`)
    queryChunks.push(sql.raw('from'))
  }
  queryChunks.push(sql`${string}`)

  const expression = sql.join(queryChunks, sql` `)

  return sql<string>`trim(${expression})`.inlineParams()
}

/**
 * Computes the MD5 hash of the argument, with the result written in hexadecimal.
 */
export function md5(text: Expression<string>): SQL<string> {
  return sql<string>`md5(${text})`
}
