/**
 * From the given object, extracts array of names of string keys. This allows skipping keys, which
 * are either numbers or symbols.
 */
export type StringKeys<T> = (keyof T & string)[];

/**
 * Magic incantation necessary for the {@link XOR} type to work. Returns `keyof T`
 */
export type UnionKeys<T> = T extends T ? keyof T : never;

/**
 * Returns a type that allows only one of the object types from the given array. When object
 * types are combined into a union type, the resultant type allows combining properties from all
 * source types. The `XOR` type will allow properties from only one of the source files.
 *
 * **Example:**
 *
 * ```typescript
 * type User = {username: string, name: string}
 * type Group = {name: string, members: string[]}
 *
 * let o1: User | Group = {username: "a", name: "b", members:[]}
 *
 * // @ts-expect-error: properties from different objects
 * let o2: XOR<[User, Group]> = {username: "a", name: "b", members:[]}
 *
 * // no errors
 * let o3: XOR<[User, Group]> = {username: "a", name: "b"}
 * let o4: XOR<[User, Group]> = {name: "c", members:[]}
 * ```
 */
export type XOR<T extends any[]> = {
  [i in keyof T]: T[i] & Partial<Record<Exclude<UnionKeys<T[number]>, keyof T[i]>, never>>;
}[number];



/**
 * Transforms a union of types into intersection of types; that is, transforms `A | B | C` into
 * `A & B & C` (for arbitrary number of types in the input union). For a union of scalar types
 * (e.g. `string | number`) it returns `never`; however, it is useful for unions of object
 * types because the intersection of object types produces an object type with properties from
 * all the types in the input union.
 */
export type UnionToIntersection<U> =
  (U extends any ? (x: U)=>void : never) extends ((x: infer I)=>void) ? I : never

/**
 * Transforms the given array of types to union of element types.
 * **Example:**
 * ```typescript
 * // Produces `string | number | boolean`
 * let x: ArrayToUnion<[string, number, boolean]>
 * ```
 */
export type ArrayToUnion<T extends any[]> = T[number]



/**
 * Converts the given union type to a tuple with elements corresponding to union members.
 * For example, `UnionToTuple<"a" | "b">` produces `["a", "b"]`.
 */
export type UnionToTuple<T> =
    UnionToIntersection<T extends never ? never : (t: T) => T> extends (t: T) => infer W
        ? [...UnionToTuple<Exclude<T, W>>, W]
        : [];



/**
 * Converts the given union type to a tuple with elements corresponding to union members.
 * For example, `KeysToTuple<{a: string, b: number}>` produces `["a", "b"]`.
 */
export type KeysToTuple<T extends object> = UnionToTuple<string & keyof T>



// let ut1: UnionToTuple<"a" | "b"> = ["a", "b"];
// let ut2: UnionToTuple<"a"> = ["a"]
// let ut3: UnionToTuple<number> = [1]

// // @ts-expect-error
// let ut4: UnionToTuple<"a" | number> = ["a", 1, 2]



// let kt1: KeysToTuple<{a: string, b: number}> = ["a", "b"]
// let kt2: KeysToTuple<{a: string}> = ["a"]
// let kt3: KeysToTuple<{}> = []

// // @ts-expect-error
// let kt4: KeysToTuple<{a: string, b: number}> = ["a", "b", "b"]



