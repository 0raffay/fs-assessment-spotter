/** Flattens intersections so editor tooltips show the final shape. */
export type Prettify<T> = { [K in keyof T]: T[K] } & {}

/** The union of a type's property values. */
export type ValueOf<T> = T[keyof T]

/** A tuple with at least one element. */
export type NonEmptyArray<T> = readonly [T, ...T[]]

/** A nominal type: `Brand<string, 'RouteId'>` is not assignable from a plain string. */
export type Brand<T, TBrand extends string> = T & { readonly __brand: TBrand }

/** A read-only record keyed by a literal union, with one value per key. */
export type RecordOf<TKey extends PropertyKey, TValue> = Readonly<Record<TKey, TValue>>

/** Maps a list of items to a lookup keyed by each item's id. */
export type ById<TItem extends { id: PropertyKey }> = ReadonlyMap<TItem['id'], TItem>

/** Makes the listed keys required while keeping the rest as they are. */
export type WithRequired<T, TKey extends keyof T> = Prettify<T & Required<Pick<T, TKey>>>

/** Narrowing helper for exhaustive `switch` statements. */
export function assertNever(value: never, message = 'Unexpected value'): never {
  throw new Error(`${message}: ${String(value)}`)
}

/** `Object.keys` that keeps the key type. Only use on objects you created. */
export function typedKeys<T extends object>(value: T): Array<keyof T> {
  return Object.keys(value) as Array<keyof T>
}

/** Builds a `ById` lookup from a list. */
export function indexById<TItem extends { id: PropertyKey }>(items: readonly TItem[]): ById<TItem> {
  return new Map(items.map((item) => [item.id, item]))
}
