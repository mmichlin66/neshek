import { UnionToIntersection } from "./UtilTypes";



/**
 * Represents simple language scalar types allowed for object properties.
 */
export type ScalarLangType = string | number| bigint | boolean;

/**
 * Represents NULL language types. This just combines `null` and `undefined`.
 */
export type NullLangType = null | undefined;

/**
 * Represents language-specific scalar types used to work with class properties.
 */
export type LangType = ScalarLangType | {[P: string]: LangType} | LangType[] | NullLangType;



/**
 * Represents data types corresponding to string property types:
 *   - "str" - string
 *   - "clob" - character-based large object
 */
export type StringDataType = "str" | "clob";

/**
 * Represents data types corresponding to temporal property types:
 *   - "date" - date only
 *   - "time" - time only
 *   - "datetime" - datetime
 *   - "timestamp" - timestamp
 */
export type TemporalDataType = "date" | "time" | "datetime" | "timestamp";

/**
 * Represents underlying data types corresponding to signed and unsigned integer property types.
 */
export type IntegerDataType = "i1" | "i2" | "i4" | "i8" | "u1" | "u2" | "u4" | "u8";

/**
 * Represents underlying data types corresponding to real (floating or fixed point) property types:
 *   - "real" - floating-point numbers of single or double precision
 *   - "dec" - fixed-point numbers (DECIMAL/NUMERIC)
 */
export type RealDataType = "real" | "dec"

/**
 * Represents underlying data types corresponding to big integer property types:
 *   - "bigint" - signed or unsigned integer of different sizes
 *   - "bit" - bit-values
 */
export type BigintDataType = "bigint" | "bit";

/**
 * Combines integer and real data types in one definition for convenience
 */
export type NumericDataType = IntegerDataType | RealDataType | BigintDataType | "year";

/**
 * Represents underlying data types corresponding to Boolean property types:
 *   - "bool" - boolean
 */
export type BoolDataType ="bool";

/**
 * Represents underlying data types corresponding to any property types except Boolean:
 */
export type NonBoolDataType = StringDataType | NumericDataType | TemporalDataType;

/**
 * Combines data types representing scalar values.
 */
export type ScalarDataType = StringDataType | NumericDataType | TemporalDataType | BoolDataType;

/**
 * Represents underlying data types corresponding to property types. These are literal string
 * types that are used to define properties in schema classes and structures. Each type corresponds
 * to one or more language types, which means that these language types can be used when working
 * with class entities. For example, if a class `Person` has a property `firstName` of DataType
 * `"str"`, then in run-time, the instances of the `Person` class will have `firstName` property
 * values of the `string` language type.
 *
 * Since **DataType** defines properties of schema classes, and since the values of these
 * properties are likely to be stored as database fields, the types used for these properties
 * closely follow the SQL types.
 *
 * In addition to regular scalar types, **DataType** includes types for links and derivative types
 * for objects and arrays.
 *
 * The following data types arew defined:
 * - string properties:
 *   - "str" - string
 *   - "clob" - character-based large object
 * - temporal (time- and date-rlated) properties
 *   - "date" - date only
 *   - "time" - time only
 *   - "datetime" - datetime
 *   - "timestamp" - timestamp
 * - numeric properties
 *   - "i1", "i2", "i4", "i8" - signed integers of different sizes
 *   - "u1", "u2", "u4", "u8" - unsigned integers of different sizes
 *   - "real" - floating-point numbers of single or double precision
 *   - "dec" - fixed-point numbers (DECIMAL/NUMERIC)
 *   - "year" - 4-digit year
 * - bigint properties
 *   - "bigint" - signed or unsigned integer of different sizes
 *   - "bit" - bit-values
 * - boolean properties
 *   - "bool" - boolean
 * - Special properties
 *   - "link" - single link
 *   - "multilink" - multi-link
 *   - "obj" - structured object
 *   - "arr" - array
 */
export type DataType = ScalarDataType | "link" | "multilink" | "obj" | "arr" | "any";



/** Combines Data and language types */
export type DataOrLangType = DataType | LangType;



/**
 * Represents data type corresponding to the given language type
 */
export type DataTypeOf<T extends LangType> =
    // T extends SqlTime ? "time" :
    T extends string ? StringDataType | TemporalDataType :
    T extends number ? IntegerDataType | RealDataType | "year" :
    T extends bigint ? BigintDataType :
    T extends boolean ? BoolDataType :
    T extends Array<LangType> ? "multilink" | "arr" :
    T extends Record<string,LangType> ? "link" | "obj" :
    undefined



/**
 * Maps data types to language types used to represent them.
 */
export type LangTypeOf<DT extends DataType | undefined | null> =
    DT extends StringDataType | TemporalDataType ? string :
    DT extends BigintDataType ? bigint : // this line must be before NumericDataType to take effect
    DT extends NumericDataType ? number :
    DT extends BoolDataType ? boolean :
    DT extends undefined ? undefined :
    DT extends null ? null :
    DT extends "multilink" | "arr" ? LangType[] :
    DT extends "link" | "obj" ? Record<string,LangType> :
    never;



/**
 * Represents possible types of properties in primary keys and unique constraints. These can be
 * one of the following:
 * - Simple scalar types: string, number, boolean, bigint and Date
 * - Class types, which represent single links
 */
export type KeyPropDataType = ScalarDataType | AClass;

/**
 * Represents a structure (object) where keys are strings and values are one of the property types
 * allowed in primary keys and unique constraints.
 */
export type KeyDataType = { [P: string]: KeyPropDataType }

/**
 * Represents possible types of object properties, which include types used for primary keys and
 * unique constraints as well as the following additional types:
 * - Multi-links
 * - Array of any types
 * - Structure containing fields of any types
 */
// export type PropType = ScalarLangType | Entity<AModel,ModelClassName<AModel>> | MultiLink<AClass>;
export type PropDataType = ScalarDataType | Array<PropDataType> | StructDataType | AClass | MultiLink<AClass>;

/**
 * Represents a structure (object) where keys are strings and values are one of the allowed
 * property types.
 */
export type StructDataType = { [P: string]: PropDataType }

/**
 * Symbol used only to make some information to be part of multi-link type. This iformation
 * includes class name, primary key and unique constraints. We use symbol to be able to bypass it while
 * enumerating with `string & keyof T`.
 * @internal
 */
export const symMultiLink = Symbol();

/**
 * Represents a multi link to a given class.
 */
export type MultiLink<C extends AClass> =
{
    /** Array of objects of the given class */
    readonly [symMultiLink]?: C;
}



/**
 * Symbol used only to make some information to be part of class type. This iformation includes
 * class name, primary key and unique constraints. We use symbol to be able to bypass it while
 * enumerating with `string & keyof T`.
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
 * doesn't have primary key, specify `undefined`.
 * @typeParam U Type representing unique constraints of the class (not including the primary key).
 * Properties of all constraints become properties of the class, so they should not be repeated in
 * the type body. If the class doesn't have unique constraints, specify `undefined`.
 */
export type Class<CN extends string, K extends KeyDataType | undefined, U extends KeyDataType[] | undefined> =
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
export type AClass = Class<string, KeyDataType | undefined, KeyDataType[] | undefined>

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
 * Represents the class with the given name from the `Model` type
 */
export type ModelClass<M extends AModel, CN extends ModelClassName<M>> = ModelClasses<M>[CN];

/**
 * Represents the primary key of the class with the given name from the `Model` type
 */
export type ModelClassKey<M extends AModel, CN extends ModelClassName<M>> =
    ModelClass<M,CN> extends Class<any, infer K, any>
        ? K extends KeyDataType ? Partial<K> : {}
        : {}

/**
 * Represents the union of all unique constraints (not including the primary key) of the class
 * with the given name from the `Model` type.
 */
export type ModelClassUnique<M extends AModel, CN extends ModelClassName<M>> =
    ModelClass<M,CN> extends Class<any, any, infer U>
        ? U extends KeyDataType[] ? Partial<U[number]> : {}
        : {}

// export type ModelClassUnique<M extends AModel, CN extends ModelClassName<M>> =
//     ModelClass<M,CN> extends Class<any, any, infer U>
//         ? U extends KeyDataType[]
//             ? { [i in keyof U]: {[P in keyof U[i]]?: U[i][P]}}[number]
//             : {}
//         : {}

// /**
//  * Represents the union of all unique constraints (not including the primary key) of the class
//  * with the given name from the `Model` type.
//  */
// export type ModelClassUnique<M extends AModel, CN extends ModelClassName<M>> =
//     ModelClass<M,CN> extends Class<any, any, infer U>
//         ? U extends KeyDataType[]
//             ? UnionToIntersection<{ [i in keyof U]:
//                 {[P in keyof U[i]]?: U[i][P]}
//             }[number]>
//             : {}
//         : {}

/**
 * Represents the properties of the given class including those from the key, the unique
 * constraints and own class properties, mapped to the corresponding type.
 */
export type ModelClassProps<M extends AModel, CN extends ModelClassName<M>> =
    ModelClassKey<M,CN> & UnionToIntersection<ModelClassUnique<M,CN>> &
    { [PN in string & keyof ModelClass<M,CN>]?: ModelClass<M,CN>[PN] }

/**
 * Represents the union of all property names of the class with the given name from the `Model`
 * type.
 */
export type ModelClassPropName<M extends AModel, CN extends ModelClassName<M>> =
    string & keyof ModelClassProps<M,CN>;

/**
 * Represents the type of property with the given name of the class with the given name from
 * the given `Model` type.
 */
export type ModelClassProp<M extends AModel, CN extends ModelClassName<M>,
        PN extends keyof ModelClassProps<M,CN>> =
    ModelClassProps<M,CN>[PN];

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
 * Represents a multi link property pointing to entities of the given class.
 */
export type EntityMultiLink<M extends AModel, C extends AClass> =
{
    /** Array of objects of the given class */
    elms?: C extends Class<infer CN, any, any> ? Entity<M,CN>[] : unknown[];

    /**
     * Cursor that can be used to retrieve additional objects. If cursor is undefined, there
     * is no more data.
     */
    cursor?: string;
}



/**
 * Represents property type of the given TypeScript type. If the property is of the Class type,
 * then this returns the corresponding Entity type.
 */
export type EntityPropType<M extends AModel, T> =
    T extends Class<infer CN, any, any> ? CN extends ModelClassName<M> ? Entity<M,CN> : never :
    T extends MultiLink<infer C> ? EntityMultiLink<M,C> :
    T extends ScalarDataType ? LangTypeOf<T> :
    never

/**
 * Represents a simple object type with properties taken from the definition of a class with the
 * given name from the given model. The properies are extracted from:
 * - primary key definition
 * - unique constraints definitions
 * - own class properties
 */
export type Entity<M extends AModel, CN extends ModelClassName<M>> =
    { [P in keyof ModelClassProps<M,CN>]?: EntityPropType<M, ModelClassProps<M,CN>[P]> }

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
    ModelClass<M,CN> extends Class<any, infer K extends KeyDataType, any>
        ? { [P in keyof K]: K[P] extends Class<infer CN1,any,any>
            ? CN1 extends ModelClassName<M> ? EntityKey<M,CN1> : never
            : K[P] extends DataType ? LangTypeOf<K[P]> : never }
        : never;

