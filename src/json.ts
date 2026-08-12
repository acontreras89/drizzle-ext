import {
  sql,
  type Column,
  type DriverValueDecoder,
  type Simplify,
  type SQL,
} from 'drizzle-orm'
import { getDecoder, type Expression, type InferData } from './lib'

/**
 * JSON functions and operators.
 * @see https://www.postgresql.org/docs/current/functions-json.html
 */

/**
 * Extracts JSON object field with the given key, as text.
 * @note For enumerated values, the resulting type remains narrowed down.
 */
export function extractText<T extends Array<unknown>>(
  array: Expression<T>,
  index: number,
): SQL<T[number] extends string ? T[number] : string>
export function extractText<T extends object, K extends keyof T>(
  object: Expression<T>,
  property: K & string,
): SQL<T[K] extends string ? T[K] : string>
export function extractText(arrayOrObject: unknown, indexOrProperty: unknown) {
  return sql`${arrayOrObject}->>${indexOrProperty}`.inlineParams()
}

/**
 * Builds a JSON object from a set of key-value pairs.
 */
export function jsonBuildObject<TColumns extends Record<string, Expression>>(
  def: TColumns,
): SQL<Simplify<InferDataMap<TColumns>>> {
  const chunks = Object.entries(def).flat()

  return sql`json_build_object(${sql
    .join(chunks, sql`, `)
    .inlineParams()})`.mapWith(jsonObjectMapper(def))
}

/**
 * Builds a JSON object from a set of key-value pairs.
 */
export function jsonbBuildObject<TColumns extends Record<string, Expression>>(
  def: TColumns,
): SQL<Simplify<InferDataMap<TColumns>>> {
  const chunks = Object.entries(def).flat()

  return sql`jsonb_build_object(${sql
    .join(chunks, sql`, `)
    .inlineParams()})`.mapWith(jsonObjectMapper(def))
}

/** @internal */
type InferDataMap<T extends Record<string, Expression>> = {
  [Key in keyof T]: InferData<T[Key]>
}

/** @internal */
type InferDriverDataMap<T extends Record<string, Expression>> = {
  [K in keyof T]: T[K] extends Column<infer TConfig>
    ? TConfig['driverParam']
    : InferData<T[K]>
}

/** @internal */
function jsonObjectMapper<T extends Record<string, Expression>>(
  def: T,
): DriverValueDecoder<
  InferDataMap<T>,
  InferDriverDataMap<T>
>['mapFromDriverValue']

function jsonObjectMapper(def: Record<string, Column>) {
  return (obj: Record<string, unknown>) => {
    return Object.entries(obj).reduce(
      (acc, [key, value]) => {
        acc[key] = value
        // respect null values
        if (value !== null) {
          const decoder = getDecoder(def[key]!)
          acc[key] = decoder.mapFromDriverValue(value)
        }
        return acc
      },
      {} as Record<string, unknown>,
    )
  }
}
