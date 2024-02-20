import { KeyType, symClass } from "./ModelTypes"
import { UnionToIntersection } from "./UtilTypes";



/**
 * Represents type information "assigned" to the symNeshekClass symbol. It includes class name,
 * primary key and unique constraints.
 * @internal
 */
type ClassInfo<TName extends string, TKey extends KeyType | undefined,
    TUnique extends KeyType[] | undefined> =
{
    name: TName;
    key?: TKey;
    unique?: TUnique;
}

type Class<TName extends string, TKey extends KeyType | undefined = any, TUnique extends KeyType[] | undefined = any> =
    { readonly [symClass]?: ClassInfo<TName, TKey, TUnique> }

type Entity<TClass extends Class<string>> =
    TClass extends Class<infer TName, infer TKey, infer TUnique>
        ? (TKey extends KeyType ? { [P in string & keyof TKey]?: TKey[P] } : {}) &
            (TUnique extends KeyType[] ? UnionToIntersection<{ [i in keyof TUnique]: {[P in keyof TUnique[i]]?: TUnique[i][P]} }[number]> : {}) &
            { [P in string & keyof TClass]?: TClass[P] }
        : {}



type OrderClass = Class<"Order", {id: number}, [{time: number, x: string}, {s: string, b: boolean, n: number}]> &
// type OrderClass = Class<"Order", {id: number}> &
// type OrderClass = Class<"Order", {id: number}, undefined> &
// type OrderClass = Class<"Order", {}, [{time: number, x: string}, {s: string, b: boolean, n: number}]> &
// type OrderClass = Class<"Order", undefined, [{time: number, x: string}, {s: string, b: boolean, n: number}]> &
    {
        total: number;
        description: string;
    }

type Order = Entity<OrderClass>;



