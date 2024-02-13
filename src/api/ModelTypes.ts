import { UnionToIntersection } from "./UtilTypes";

/**
 * Represents simple scalar types allowed for object properties.
 */
export type ScalarType = string | number | boolean | bigint | Date;

/**
 * Represents possible types of object properties, which can be one of the following:
 * - Simple scalar types: string, number, BigInt and Boolean
 * - Links: single and multi links
 * - Array of any possible types
 * - Structure containing fields of any possible types
 *
 * This is a recursive type because, for example, it can be an array of structures, where some
 * fields can also be arrays or structures.
 */
export type PropType = ScalarType | Array<PropType> | MultiLink | StructType;

/**
 * Represents a structure (object) with restricted property types.
 */
export type StructType = { [P: string]: PropType }

// /**
//  * Symbol used only to make some information to be part of a link type.
//  * @internal
//  */
// export const symLink = Symbol();

// /**
//  * Represents a single link to a given class.
//  */
// export type Link<TClass extends Class<any> = any> = TClass &
//     { symLink?: TClass }

/**
 * Represents a multi link to a given class.
 */
export type MultiLink<TClass extends StructType = any> =
{
    /** Array of objects of the given class */
    elms?: TClass[];

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
export const symNeshekClass = Symbol();

/**
 * Represents type information "assigned" to the symNeshekClass symbol. It includes class name,
 * primary key and unique constraints.
 * @internal
 */
export type NeshekClassInfo<TName extends string, TKey extends StructType,
    TUnique extends StructType[]> =
{
    name: TName;
    key?: TKey;
    unique?: TUnique;
}

/**
 * Type from which all types representing Neshek model classes should derive.
 * @typeParam TName name of the class by which the class can be referred to when invoking
 * repository operations. This name most likely will be the name of the table used in the
 * repository. Usually this name is the same as the TypeScript class name.
 * @typeParam TKey type representing the primary key of the class. All properties of this type
 * become properties of the class, so they should not be repeated in the type body. If the class
 * doesn't have primary key, specify `{}`, which is also a default of this parameter.
 * @typeParam TUnique type representing unique constraints of the class. Properties of all
 * constraints become properties of the class, so they should not be repeated in the type body.
 * If the class doesn't have primary key, specify `[]`, which is also a default of this parameter.
 */
export type Class<TName extends string, TKey extends StructType = any, TUnique extends StructType[] = any> =
    { [P in keyof TKey]?: TKey[P] } &
    { readonly [symNeshekClass]?: NeshekClassInfo<TName, TKey, TUnique> }


/**
 * Transforms array of Neshek class types into object type where keys are class names and
 * their types are class types. This type is used for Model type definition.
 *
 * **Example:**
 * ```typescript
 * type MyClasses = NeshekClasses<[Order, Product]>;
 *
 * // the above line is equivalent to
 * type MyClasses = {
 *     Order: Order;
 *     Product: Product;
 * }
 * ```
 *
 * @typeParam T array of class types
 */
export type NeshekClasses<T extends Class<any>[]> =
    UnionToIntersection<
        { [i in keyof T]: T[i] extends Class<infer S> ? {[P in S]: T[i]} : never }[number]
    >



/**
 * Symbol used only to make some information to be part of struct type. This iformation includes
 * struct name. We use symbol to be able to not enumerate it using `keyof T & string`.
 * @internal
 */
export const symNeshekStruct = Symbol();

/**
 * Represents type information "assigned" to the symNeshekStruct symbol. It includes struct name.
 * @internal
 */
export type NeshekStructInfo<TName extends string> =
{
    name: TName;
}

/**
 * Type from which all types representing Neshek model structures should derive.
 * @typeParam TName name of the struct by which the struct can be referred to. Usually this name
 * is the same as the TypeScript class name.
 */
export type NeshekStruct<TName extends string> =
    { readonly [symNeshekStruct]?: NeshekStructInfo<TName> }


/**
 * Transforms array of Neshek struct types into object type where keys are struct names and
 * their types are struct types. This type is used for Model type definition.
 *
 * **Example:**
 * ```typescript
 * type MyStructs = NeshekStructs<[Note, Comment]>;
 *
 * // the above line is equivalent to
 * type MyStructs = {
 *     Note: Note;
 *     Comment: Comment;
 * }
 * ```
 *
 * @typeParam T array of struct types
 */
export type NeshekStructs<T extends NeshekStruct<any>[]> =
    UnionToIntersection<
        { [i in keyof T]: T[i] extends NeshekStruct<infer S> ? {[P in S]: T[i]} : never }[number]
    >



/**
 * Type that combines types definitions of classes, structures and type aliases.
 */
export type Model<TClasses extends Class<any>[] = [],
    TStructs extends NeshekStruct<any>[] = []> =
{
    classes: NeshekClasses<TClasses>;
    structs: NeshekStructs<TStructs>;
}



/** Extracts `classes` object's type from the `Model` type */
export type ModelClasses<TModel extends Model> = TModel["classes"];

/** Extracts type representing names of classes from the `Model` type */
export type ModelClassName<TModel extends Model> = string & keyof ModelClasses<TModel>;

/** Extracts type representing the classes with the given name from the `Model` type */
export type ModelClass<TModel extends Model, TName extends ModelClassName<TModel>> =
    ModelClasses<TModel>[TName];

/** Extracts class name type from the given class type */
export type NameOfClass<TClass> = TClass extends Class<infer TName> ? TName : never;

/**
 * Extracts primary key type of the given Model class type. For cross-link classes, it is a
 * combination of primary keys of the linked classes.
 */
export type KeyOfClass<TClass> = TClass extends Class<infer TName, infer TKey>
    ? { [P in keyof TKey]-?: TKey[P] extends Class<infer TName, infer TNestedClass>
        ? KeyOfClass<TNestedClass>
        : TKey[P] }
    : never;



/** Extracts `structs` object's type from the `Model` type */
export type ModelStructs<TModel extends Model> = TModel["structs"];

/** Extracts type representing names of struct types from the `Model` type */
export type ModelStructName<TModel extends Model> = keyof ModelStructs<TModel>;

/** Extracts type representing the structure with the given name from the `Model` type */
export type ModelStruct<TModel extends Model, TName extends ModelStructName<TModel>> =
    ModelStructs<TModel>[TName];

/** Extracts class name type from the given class type */
export type NameOfStruct<TStruct> = TStruct extends NeshekStruct<infer TName> ? TName : never;



