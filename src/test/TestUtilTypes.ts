import { ArrayToUnion, XOR } from "neshek"

type User = {username: string, name: string, first?: string}
type Group = {name: string, members?: string[]}

let o1: User | Group = {username: "a", name: "b", members:[]}

// @ts-expect-error: properies from different objects
let o2: XOR<[User, Group]> = {username: "a", name: "b", members:[]}

// no errors
let o3: XOR<[User, Group]> = {username: "a", name: "b"}
let o4: XOR<[User, Group]> = {name: "c", members: []}



// Produces `string | number | boolean`
let x1: ArrayToUnion<[string, number, boolean]>;
// Produces `string | number | Date`
let x2: ArrayToUnion<(string | number | Date)[]>;



