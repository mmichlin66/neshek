import { UnionToIntersection } from "./UtilTypes";



/**
 * Represents simple scalar types allowed for object properties.
 */
export type ScalarType = string | number | boolean | bigint | Date;

/**
 * Represents possible types of properties in primary keys and unique constraints. These can be
 * one of the following:
 * - Simple scalar types: string, number, boolean, bigint and Date
 * - Class types, which represent single links
 */
export type KeyPropType = ScalarType | AClass;

/**
 * Represents a structure (object) where keys are strings and values are one of the property types
 * allowed in primary keys and unique constraints.
 */
export type KeyType = { [P: string]: KeyPropType }

/**
 * Represents possible types of object properties, which include types used for primary keys and
 * unique constraints as well as the following additional types:
 * - Multi-links
 * - Array of any types
 * - Structure containing fields of any types
 */
export type PropType = KeyPropType | Array<PropType> | MultiLink<AClass> | StructType;

/**
 * Represents a structure (object) where keys are strings and values are one of the allowed
 * property types.
 */
export type StructType = { [P: string]: PropType }

/**
 * Represents a multi link to a given class.
 */
export type MultiLink<C extends AClass> =
{
    /** Array of objects of the given class */
    elms?: C[];

    /**
     * Cursor that can be used to retrieve additional objects. If cursor is undefined, there
     * is no more data.
     */
    cursor?: string;
}



/**
 * Symbol used only to make some information to be part of class type. This iformation includes
 * class name, primary key and unique constraints. We use symbol to be able to not enumerate it
 * using `keyof T & string`.
 * @internal
 */
export const symClass = Symbol();

// /**
//  * Represents type information "assigned" to the symNeshekClass symbol. It includes class name,
//  * primary key and unique constraints.
//  * @internal
//  */
// type ClassInfo<TName extends string, TKey extends KeyType | undefined,
//     TUnique extends KeyType[] | undefined> =
// {
//     name: TName;
//     key?: TKey;
//     unique?: TUnique;
// }

type Class<TName extends string, TKey extends KeyType | undefined, TUnique extends KeyType[] | undefined> =
{
    readonly [symClass]?: {
        name: TName,
        key: TKey,
        uc: TUnique
    }
}

type AClass = Class<any,any,any>



type Classes<T extends AClass[]> =
    UnionToIntersection<
        { [i in keyof T]: T[i] extends Class<infer TName,any,any> ? {[P in TName]: T[i]} : never }[number]
    >

type Model<TClasses extends AClass[]> =
{
    classes: Classes<TClasses>;
}

type AModel = Model<AClass[]>



// type Entity<TClass extends Class<any,any,any>> =
//     TClass extends Class<any, infer TKey, infer TUnique>
//         ? (TKey extends KeyType ? { [P in string & keyof TKey]?: TKey[P] } : {}) &
//             (TUnique extends KeyType[] ? UnionToIntersection<{ [i in keyof TUnique]: {[P in keyof TUnique[i]]?: TUnique[i][P]} }[number]> : {}) &
//             { [P in string & keyof TClass]?: TClass[P] }
//         : {}

type ModelClasses<M extends AModel> = M["classes"];

type ModelClassName<M extends AModel> = keyof ModelClasses<M>;

type ModelClass<M extends AModel, CN extends ModelClassName<M>> =
    ModelClasses<M>[CN];

type ModelClassPropName<M extends AModel, CN extends ModelClassName<M>> =
    string & keyof ModelClass<M,CN>;

type ModelClassProp<M extends AModel, CN extends ModelClassName<M>,
        PN extends ModelClassPropName<M,CN>> =
    ModelClass<M,CN>[PN];

/**
 * Extracts primary key type of the given Model class type. For cross-link classes, it is a
 * combination of primary keys of the linked classes.
 */
type KeyOfClass<C extends AClass> = C extends Class<any, infer K, any> ? K : never;



type EntityPropType<M extends AModel, T> =
    T extends Class<infer CN, any, any>
        ? CN extends ModelClassName<M> ? Entity<M,CN> : never
        : T

// type ClassKeyPropType<M extends Model<AnyClass[]>, T> =
//     T extends Class<infer CN, any, any>
//         ? CN extends ModelClassName<M> ? KeyOfClass<T> : never
//         : T

type ModelClassKeyProps<M extends AModel, CN extends ModelClassName<M>> =
    ModelClass<M,CN> extends Class<any, infer K, any>
        ? K extends KeyType ? { [P in keyof K]?: EntityPropType<M,K[P]> } : {}
        : {}

type ModelClassUniqueProps<M extends AModel, CN extends ModelClassName<M>> =
    ModelClass<M,CN> extends Class<any, any, infer U>
        ? U extends KeyType[]
            ? UnionToIntersection<{ [i in keyof U]: {[P in keyof U[i]]?: U[i][P]} }[number]>
            : {}
        : {}

type ModelClassOwnProps<M extends AModel, CN extends ModelClassName<M>> =
    ModelClass<M,CN> extends AClass
        ? { [PN in ModelClassPropName<M,CN>]?: EntityPropType<M,ModelClassProp<M,CN,PN>> }
        : {}

type Entity<M extends Model<Class<any,any,any>[]>, CN extends ModelClassName<M>> =
    ModelClassKeyProps<M,CN> & ModelClassUniqueProps<M,CN> & ModelClassOwnProps<M,CN>



type OrderClass = Class<"Order", {id: number}, [{time: number, x: string}, {s: string, b: boolean, n: number}]> &
// type OrderClass = Class<"Order", {id: number}, undefined> &
// type OrderClass = Class<"Order", {}, [{time: number, x: string}, {s: string, b: boolean, n: number}]> &
// type OrderClass = Class<"Order", undefined, [{time: number, x: string}, {s: string, b: boolean, n: number}]> &
{
    total: number;
    description: string;
}

type ProductClass = Class<"Product", {code: string}, undefined> &
{
    name: string;
    msrp: number;
    similarProduct: ProductClass;
}

type ItemClass = Class<"Item", {order: OrderClass, product: ProductClass}, undefined> &
{
    qty: number;
    price: number;
}

type MyModel = Model<[OrderClass, ProductClass, ItemClass]>;

type C = ModelClass<MyModel, "Order">
type P = keyof ModelClass<MyModel, "Order">
type Props = ModelClassPropName<MyModel, "Order">

type Order = Entity<MyModel, "Order">;
type Product = Entity<MyModel, "Product">;
type Item = Entity<MyModel, "Item">;

let product: Product = {code: "123", msrp: 13.95, similarProduct: {name: "qwerty"}}
let item: Item = {order: {id: 123}, }



