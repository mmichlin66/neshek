import { XOR } from "../index"

type User = {username: string, name: string, first?: string}
type Group = {name: string, members?: string[]}

let o1: User | Group = {username: "a", name: "b", members:[]}

// @ts-expect-error: properies from different objects
let o2: XOR<[User, Group]> = {username: "a", name: "b", members:[]}

// no errors
let o3: XOR<[User, Group]> = {username: "a", name: "b"}
let o4: XOR<[User, Group]> = {name: "c", members: []}



// // Produces `string | number | boolean`
// let x1: ArrayToUnion<[string, number, boolean]>;
// // Produces `string | number | Date`
// let x2: ArrayToUnion<(string | number | Date)[]>;



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



