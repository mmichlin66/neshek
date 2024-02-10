import { ModelClass, ModelClassName, ModelClasses, Model, NeshekClass, KeyOfModelClass, MultiLink } from "neshek";

export type Order = NeshekClass<{id: number}> &
{
    items?: MultiLink<Item>;
}

export type Product = NeshekClass<{code: string}> &
{
    name?: string;
    msrp?: number;
    notes?: Note[];
}

export type Note =
{
    time?: number;
    text?: string;
}

export type Item = NeshekClass<{order: Order, product: Product}> &
{
    price?: number;
}

export type ExtraItemInfo = NeshekClass<{item: Item}> &
{
    comments: string[];
}

export type MyClasses =
{
    Order: Order;
    Product: Product;
    Item: Item;
    ExtraItemInfo: ExtraItemInfo;
}

export type MyStructs =
{
    Note: Note;
}

export type MyModel = Model<MyClasses, MyStructs>;



let x1: ModelClasses<MyModel>;
let x2: ModelClassName<MyModel> = "Item";
let x3: ModelClass<MyModel, "Order"> = {id: 123};
let x3pk: KeyOfModelClass<Order>;
let x4: ModelClass<MyModel, "Product"> = {code: "123", msrp: 35.99, name: "desk", notes: [{}]};
let x4pk: KeyOfModelClass<Product>;
let x5: ModelClass<MyModel, "Item"> = {order: {id: 123}};
let x5pk: KeyOfModelClass<Item> = {order: {id: 123}, product: {code: "123"}};
let x6: ModelClass<MyModel, "ExtraItemInfo">;
let x6pk: KeyOfModelClass<ExtraItemInfo> = {item: {order: {id: 123}, product: {code: "123"}}};

// // @ts-expect-error (should be either code or id)
// let x7pk: PKofModelClass<Order> | PKofModelClass<Product> = {code: "123", id: 123};



// type A = {id: number}
// type B = {code: string}

// type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };
// type XOR<T, U> = (T | U) extends object ? (Without<T, U> & U) | (Without<U, T> & T) : T | U;
// type C = XOR<A,B>;

// // @ts-expect-error
// let c: C = {code: "123", id: 123}


// type UnionKeys<T> = T extends T ? keyof T : never;
// type OneOf<T extends {}[]> = {
//   [K in keyof T]: T[K] & Partial<Record<Exclude<UnionKeys<T[number]>, keyof T[K]>, never>>;
// }[number];

// interface Cat {
//     isCat: true;
// }

// interface Dog {
//     isDog: true;
// }

// interface Bird {
//     isBird: true;
// }

// type Animal = OneOf<[Cat, Dog, Bird]>;
// //   ^?

// const cat: Animal = { isCat: true };
// const dog: Animal = { isDog: true };
// // @ts-expect-error
// const catDog: Animal = { isCat: true, isDog: true }; // error


const symN = Symbol();
type C<N extends string = string> = {[symN]?: N}

type AC2AS<T extends C[]> = { [i in keyof T]: T[i] extends C<infer S> ? S : never }

type AC2AO<T extends C[]> = { [i in keyof T]: T[i] extends C<infer S> ? {[P in S]: T[i]} : never }

type UnionToIntersection<U> =
  (U extends any ? (x: U)=>void : never) extends ((x: infer I)=>void) ? I : never

type AC2O<T extends C[]> = UnionToIntersection<AC2AO<T>[number]>

type X1 = C<"X1"> & {id: number}
type X2 = C<"X2"> & {code: string}

type AS = AC2AS<[X1,X2]>[number]
type AO = AC2AO<[X1,X2]>[number]
type O = AC2O<[X1,X2]>
let x: keyof O

let o: AC2O<[X1,X2]> = {X1: {id: 123}, X2: {code: "123"}}
