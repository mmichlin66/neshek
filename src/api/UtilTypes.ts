/** Represents an array type or undefined. */
export type ArrayOrUndefined<T> = T[] | undefined;

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
 * // @ts-expect-error: properies from different objects
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

type User = {username: string, name: string, first?: string}
type Group = {name: string, members?: string[]}

let o1: User | Group = {username: "a", name: "b", members:[]}

// @ts-expect-error: properies from different objects
let o2: XOR<[User, Group]> = {username: "a", name: "b", members:[]}

// no errors
let o3: XOR<[User, Group]> = {username: "a", name: "b"}
let o4: XOR<[User, Group]> = {name: "c", members: []}



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

// Produces `string | number | boolean`
let x1: ArrayToUnion<[string, number, boolean]>;
// Produces `string | number | Date`
let x2: ArrayToUnion<(string | number | Date)[]>;

// /**
//  * Transforms the given array of generic types to union of types inferred from element types.
//  * **Example:**
//  * ```typescript
//  * // Produces `string | number | boolean`
//  * let x: ArrayToInferredArray<[string, number, boolean]>
//  * ```
//  */
// export type ArrayToInferredArray<TArr extends any[]> = TArr extends (infer T)[]
//     ? { [i in keyof TArr]: TArr[i] extends infer U ? U extends  : never }
//     : never

// type Elm<T> = {type: T}
// type ElmTypes = string | number | boolean;
// // Produces `string | number | boolean`
// let t1: ArrayToInferredArray<[Elm<string>, Elm<number>, Elm<boolean>]>;



