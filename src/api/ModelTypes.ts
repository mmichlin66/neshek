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
export type PropType = ScalarType | AClass | MultiLink<AClass>;
// export type PropType = KeyPropType | Array<PropType> | MultiLink<AClass> | StructType;

// /**
//  * Represents a structure (object) where keys are strings and values are one of the allowed
//  * property types.
//  */
// export type StructType = { [P: string]: PropType }

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
 * using `string & keyof T`.
 * @internal
 */
export const symClass = Symbol();

/**
 * Type from which all types representing Neshek model classes should derive.
 * @typeParam CN Name of the class by which the class can be referred to when invoking
 * repository operations. This name most likely will be the name of the table used in the
 * repository. Usually this name is the same as the TypeScript class name.
 * @typeParam K Type representing the primary key of the class. All properties of this type
 * become properties of the class, so they should not be repeated in the type body. If the class
 * doesn't have primary key, specify `{}`, which is also a default of this parameter.
 * @typeParam U Type representing unique constraints of the class. Properties of all
 * constraints become properties of the class, so they should not be repeated in the type body.
 * If the class doesn't have primary key, specify `[]`, which is also a default of this parameter.
 */
export type Class<CN extends string, K extends KeyType | undefined, U extends KeyType[] | undefined> =
{
    readonly [symClass]?: {
        name: CN,
        key: K,
        uc: U
    }
}

/**
 * Helper type with all template parameters set to default types. This is needed for easier
 * referencing in other type definitions.
 */
export type AClass = Class<string, KeyType | undefined, KeyType[] | undefined>

/**
 * Transforms array of Neshek class types into object type where keys are class names and
 * their types are class types. This type is used for Model type definition.
 *
 * **Example:**
 * ```typescript
 * type MyClasses = Classes<[Order, Product]>;
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
export type Classes<T extends AClass[]> =
    UnionToIntersection<
        { [i in keyof T]: T[i] extends Class<infer TName,any,any> ? {[P in TName]: T[i]} : never }[number]
    >



/**
 * Symbol used only to make some information to be part of struct type. This iformation includes
 * struct name. We use symbol to be able to not enumerate it using `keyof T & string`.
 * @internal
 */
export const symStruct = Symbol();

/**
 * Type from which all types representing Neshek model structures should derive.
 * @typeParam SN Name of the struct by which the struct can be referred to. Usually this name
 * is the same as the TypeScript class name.
 */
export type Struct<SN extends string> =
    {
        readonly [symStruct]?: {
            name: SN;
        }
    }

/**
 * Helper type with all template parameters set to default types. This is needed for easier
 * referencing in other type definitions.
 */
export type AStruct = Struct<string>

/**
 * Transforms array of Neshek struct types into object type where keys are struct names and
 * their types are struct types. This type is used for Model type definition.
 *
 * **Example:**
 * ```typescript
 * type MyStructs = Structs<[Note, Comment]>;
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
export type Structs<T extends AStruct[]> =
    UnionToIntersection<
        { [i in keyof T]: T[i] extends Struct<infer TName> ? {[P in TName]: T[i]} : never }[number]
    >



/**
 * Type that combines types definitions of classes, structures and type aliases.
 */
export type Model<TClasses extends AClass[], TStructs extends AStruct[]> =
{
    classes: Classes<TClasses>;
    structs: Structs<TStructs>;
}

/**
 * Helper type with all template parameters set to default types. This is needed for easier
 * referencing in other type definitions.
 */
export type AModel = Model<AClass[], AStruct[]>



/**
 * Represents `classes` object's type from the `Model` type
 */
export type ModelClasses<M extends AModel> = M["classes"];

/**
 * Represents the union of all class names from the `Model` type
 */
export type ModelClassName<M extends AModel> = string & keyof ModelClasses<M>;

/**
 * Representing the class with the given name from the `Model` type
 */
export type ModelClass<M extends AModel, CN extends ModelClassName<M>> =
    ModelClasses<M>[CN];

/**
 * Represents the union of all property names of the class with the given name from the `Model`
 * type.
 */
export type ModelClassPropName<M extends AModel, CN extends ModelClassName<M>> =
    string & keyof ModelClass<M,CN>;

/**
 * Represents the type of property with the given name of the class with the given name from
 * the given `Model` type.
 */
export type ModelClassProp<M extends AModel, CN extends ModelClassName<M>,
        PN extends ModelClassPropName<M,CN>> =
    ModelClass<M,CN>[PN];

/** Extracts class name type from the given class type */
export type NameOfClass<C extends AClass> = C extends Class<infer CN,any,any> ? CN : never;

/**
 * Extracts primary key type of the given Model class type.
 */
export type KeyOfClass<C extends AClass> = C extends Class<any, infer K, any> ? K : never;



/** Extracts `structs` object's type from the `Model` type */
export type ModelStructs<M extends AModel> = M["structs"];

/** Extracts type representing names of struct types from the `Model` type */
export type ModelStructName<M extends AModel> = keyof ModelStructs<M>;

/** Extracts type representing the structure with the given name from the `Model` type */
export type ModelStruct<M extends AModel, SN extends ModelStructName<M>> =
    ModelStructs<M>[SN];

/** Extracts class name type from the given class type */
export type NameOfStruct<S> = S extends Struct<infer SN> ? SN : never;



/**
 * Represents property type of the given TypeScript type. If the property is of the Class type,
 * then this returns the corresponding Entity type.
 */
export type EntityPropType<M extends AModel, T> =
    T extends Class<infer CN, any, any>
        ? CN extends ModelClassName<M> ? Entity<M,CN> : never
        : T

/**
 * Represents properies derived from the class's primary key definition of the class with the
 * given name from the given model.
 */
export type ModelClassKeyProps<M extends AModel, CN extends ModelClassName<M>> =
    ModelClass<M,CN> extends Class<any, infer K, any>
        ? K extends KeyType ? { [P in keyof K]?: EntityPropType<M,K[P]> } : {}
        : {}

/**
 * Represents properies derived from the class's unique constraint definitions of the class with
 * the given name from the given model.
 */
export type ModelClassUniqueProps<M extends AModel, CN extends ModelClassName<M>> =
    ModelClass<M,CN> extends Class<any, any, infer U>
        ? U extends KeyType[]
            ? UnionToIntersection<{ [i in keyof U]:
                {[P in keyof U[i]]?: EntityPropType<M,U[i][P]>}
              }[number]>
            : {}
        : {}

/**
 * Represents properies derived from the class's own property definition of the class with the
 * given name from the given model.
 */
export type ModelClassOwnProps<M extends AModel, CN extends ModelClassName<M>> =
    ModelClass<M,CN> extends AClass
        ? { [PN in ModelClassPropName<M,CN>]?: EntityPropType<M,ModelClassProp<M,CN,PN>> }
        : {}

/**
 * Represents a simple object type with properties taken from the definition of a class with the
 * given name from the given model. The properies are extracted from:
 * - primary key definition
 * - unique constraints definitions
 * - own class properties
 */
export type Entity<M extends AModel, CN extends ModelClassName<M>> =
    ModelClassKeyProps<M,CN> & ModelClassUniqueProps<M,CN> & ModelClassOwnProps<M,CN>

/**
 * Represents a union of all properties for the entity corresponding to the class with the given
 * name from the given model.
 */
export type EntityPropName<M extends AModel, CN extends ModelClassName<M>> =
    string & keyof Entity<M,CN>

/**
 * Extracts primary key type of the given Model class type as a "deep" object, which goes down the
 * object links (if links are part of the key) until scalar values are found.
 */
export type EntityKey<M extends AModel, CN extends ModelClassName<M>> =
    ModelClass<M,CN> extends Class<any, infer K, any>
        ? { [P in string & keyof K]: K[P] extends Class<infer CN1,any,any>
            ? CN1 extends ModelClassName<M> ? EntityKey<M,CN1> : never
            : K[P] }
        : never;

