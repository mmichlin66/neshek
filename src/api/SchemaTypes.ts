import {
    PropType, MultiLink, ModelClassName, ModelStructName, ModelStruct, NameOfClass, Class,
    AModel, AClass, EntityKey, Entity, EntityPropName
} from "./ModelTypes";
import { KeysToTuple } from "./UtilTypes";

/**
 * Represents underlying data types corresponding to property types:
 * - string properties:
 *   - "str" - string
 *   - "clob" - character-based large object
 *   - "date" - date only
 *   - "time" - time only
 *   - "datetime" - datetime
 * - numeric properties
 *   - "int" - signed or unsigned integer of different sizes
 *   - "real" - floating-point numbers of single or double precision
 *   - "dec" - fixed-point numbers (DECIMAL/NUMERIC)
 *   - "bit" - bit-values
 *   - "timestamp" - timestamp
 * - bigint properties
 *   - "bigint" - signed or unsigned integer of different sizes
 *   - "dec" - fixed-point numbers (DECIMAL/NUMERIC)
 *   - "bit" - bit-values
 *   - "timestamp" - timestamp
 * - boolean properties
 *   - "bool" - boolean
 * - Date properties
 *   - "timestamp" - timestamp
 * - Special properties
 *   - "link" - single link
 *   - "multilink" - multi-link
 *   - "obj" - structured object
 *   - "arr" - array
 */
export type DataType =
    "str" | "clob" |
    "bool" |
    "int" | "bigint" | "real" | "dec" | "bits" |
    "date" | "time" | "datetime" | "timestamp" |
    "link" | "multilink" |
    "obj" | "arr";



/**
 * Represents underlying data type corresponding to the given property type
 */
export type DataTypeOfPropType<M extends AModel, T extends PropType> =
    T extends string ? "str" | "date" | "time" | "datetime" | "timestamp" :
    T extends number ? "int" | "real" | "dec" | "bit" | "ts" :
    T extends bigint ? "bigint" | "dec" | "bit" | "ts" :
    T extends boolean ? "bool" :
    // T extends Date ? "timestamp" :
    T extends MultiLink<AClass> ? "multilink" :
    T extends Class<infer CN,any,any> ? CN extends ModelClassName<M>
        ? "link"
        : never :
    never

// type C = Class<"C"> & {a?: string};
// type S = Struct<"S">;
// type M = Model<[C], [S]>

// let dt1: DataTypeOfPropType<M,C>;
// let dt2: DataTypeOfPropType<Model,S>;
// let dt3: DataTypeOfPropType<Model, {a: string}>;



// /**
//  * Transforms the given primary key object to an object with the same properties and string values.
//  * This type is needed for single links to specify field names in the table with the foreign key.
//  * For example, if the primary key of the Order object is {id: number}, the corresponding field
//  * in the table with the foreign key might be named "order_id".
//  */
// export type ForeignKeyFields<K extends object> =
//     { [P in keyof K & string]: K[P] extends Class<any, infer TNestedKey>
//         ? ForeignKeyFields<TNestedKey> : string }



/**
 * Defines property definition attributes that are common for all data types
 */
export type CommonPropDef =
{
    /**
     * Property's data type that determines its structure and meaning.
     */
    dt: DataType,

    /**
     * Determines whether the field must have a non-null value in the repository.
     * Default value: false.
     */
    required?: boolean;

    /**
     * Determines whether the field value must be unique across all objects of its class.
     * Default value: false.
     */
    unique?: boolean;
}

/**
 * Contains attributes defining behavior of a string property
 */
export type StringPropDef = CommonPropDef &
{
    dt: "str";
    minlen?: number;
    maxlen?: number;
    regex?: RegExp;
    choices?: string[];
}

/**
 * Contains attributes defining behavior of a CLOB property
 */
export type ClobPropDef = CommonPropDef &
{
    dt: "clob";
    minlen?: number;
    maxlen?: number;
}

/**
 * Contains attributes defining behavior of an integer number property
 */
export type IntPropDef = CommonPropDef &
{
    dt: "int";
    min?: number;
    max?: number;
    step?: number;
}

/**
 * Contains attributes defining behavior of a BigInt property
 */
export type BigIntPropDef = CommonPropDef &
{
    dt: "bigint";
    min?: bigint;
    max?: bigint;
}

/**
 * Contains attributes defining behavior of a floating-point real number property
 */
export type RealPropDef = CommonPropDef &
{
    dt: "real";
    precision?: number;
    min?: number;
    max?: number;
}

/**
 * Contains attributes defining behavior of a fixed-point real property
 */
export type DecimalPropDef = CommonPropDef &
{
    dt: "dec";
    precision?: number | [number, number];
    min?: number;
    max?: number;
}

/**
 * Contains attributes defining behavior of a bit-value property
 */
export type BitValuePropDef = CommonPropDef &
{
    dt: "bit";
    size?: number;
}

/**
 * Contains attributes defining behavior of a Boolean property
 */
export type BoolPropDef = CommonPropDef &
{
    dt: "bool";
}

/**
 * Contains attributes defining behavior of a timestamp property
 */
export type TimestampPropDef = CommonPropDef &
{
    dt: "timestamp";
    precision?: "h" | "m" | "s" | "ms" | "ns";
}

/**
 * Contains attributes defining behavior of a date-only property
 */
export type DatePropDef = CommonPropDef &
{
    dt: "date";
}

/**
 * Contains attributes defining behavior of a time-only property
 */
export type TimePropDef = CommonPropDef &
{
    dt: "time";
    precision?: number;
}

/**
 * Contains attributes defining behavior of a date-time property
 */
export type DateTimePropDef = CommonPropDef &
{
    dt: "datetime";
    precision?: number;
}

// /**
//  * Contains attributes defining behavior of a structure property
//  */
// export type ArrayPropDef<M extends AModel, E> = CommonPropDef &
// {
//     dt: "arr";
//     elm: PropDef<M, E>;
// }

/**
 * Helper type with all template parameters set to `any`. This is needed for easier referencing
 * in other type definitions.
 */
export type ALinkPropDef = CommonPropDef &
{
    dt: "link";
    target: string;
}

/**
 * Contains attributes defining behavior of a single link property.
 * @typeParam PN class that is a target of the link.
 */
export type LinkPropDef<M extends AModel, PN extends ModelClassName<M>> = ALinkPropDef &
{
    target: PN;
}

/**
 * Helper type with all template parameters set to `any`. This is needed for easier referencing
 * in other type definitions.
 */
export type AMultiLinkPropDef = CommonPropDef &
{
    dt: "multilink";
    origin: string;
    originKey: string;
}

/**
 * Contains attributes defining behavior of a multi link property pointing to a class or crosslink.
 * @typeParam TClass class that is a target of the multi link; that is, the origin of the
 * corresponding single link.
 *
 */
export type MultiLinkPropDef<M extends AModel, C extends AClass> = AMultiLinkPropDef &
{
    origin: NameOfClass<C>;
    originKey: string & keyof Entity<M, NameOfClass<C>>;
}

// /**
//  * Contains attributes defining behavior of a structure property
//  */
// export type StructPropDef<M extends AModel, T> = CommonPropDef & {dt: "obj"} & (
//     T extends Struct<infer TName> ? TName extends keyof M["structs"]
//         ? {name: TName}
//         : T extends StructType ? {props: StructDef<M, T>} : never :
//     T extends StructType ? {props: StructDef<M, T>} :
//     never)

/**
 * Helper type with all template parameters set to `any`. This is needed for easier referencing
 * in other type definitions.
 */
export type APropDef = StringPropDef | DatePropDef | TimePropDef | DateTimePropDef |
    IntPropDef | BigIntPropDef | RealPropDef | DecimalPropDef | BitValuePropDef | TimestampPropDef |
    BoolPropDef | ALinkPropDef | AMultiLinkPropDef;

/**
 * Represents attributes defining behavior of a property of a given type.
 */
export type PropDef<M extends AModel, T> = APropDef &
(
    T extends string ? StringPropDef | DatePropDef | TimePropDef | DateTimePropDef | TimestampPropDef :
    T extends number ? IntPropDef | RealPropDef | DecimalPropDef | BitValuePropDef :
    T extends bigint ? BigIntPropDef | DecimalPropDef | BitValuePropDef :
    T extends boolean ? BoolPropDef :
    // T extends Date ? TimestampPropDef :
    // T extends Array<infer E> ? ArrayPropDef<M,E> :
    T extends MultiLink<infer C> ? MultiLinkPropDef<M,C> :
    T extends Entity<M, infer CN> ? CN extends ModelClassName<M>
        ? LinkPropDef<M,CN>
        : never :
    never
);

/**
 * Helper type with all template parameters set to `any`. This is needed for easier referencing
 * in other type definitions.
 */
export type AStructDef = { [P: string]: APropDef }

/**
 * Represents definition of a structured type, which defines property names and corresponding
 * property definitions. Structure definitions can be used to define class properties or to
 * serve as a "base" for a class. In the latter case, the class will have all the proprties
 * that the structure defines.
 */
export type StructDef<M extends AModel, SN extends ModelStructName<M>> = AStructDef &
{
    [P in string & keyof ModelStruct<M,SN>]-?: PropDef<M, ModelStruct<M,SN>[P]>
}

/**
 * Represents definition of a class.
 */
export type AClassDef =
{
    base?: string | string[];

    /**
     * Defenitions of class properties
     */
    props: { [P: string]: APropDef };

    /**
     * Defines what fields constitute a primary key for the class. The key can be a single field
     * or a collection of fields.
     */
    key?: string[];

    /**
     * If the class is declared abstract, no instances of it can be created in the repository.
     * It can only be used as a base for other classes.
     */
    abstract?: boolean;
}

/**
 * Represents definition of a class with proper template parameters.
 */
export type ClassDef<M extends AModel, CN extends ModelClassName<M>> = AClassDef &
{
    /**
     * Defines one or more base classes or structures.
     */
    base?: ModelClassName<M> | ModelClassName<M>[];

    /**
     * Defenitions of class properties
     */
    props: { [P in EntityPropName<M,CN>]-?: PropDef<M, Entity<M,CN>[P]> };

    /**
     * Defines what fields constitute a primary key for the class. The key can be a single field
     * or a collection of fields.
     */
    key?: (string & keyof EntityKey<M,CN>)[];
    // the following is commented out although it defines the proper tuple type; however, the
    // correct order of properties in the tuple is non-deterministic and the compiler sometimes
    // fails.
    // key?: KeysToTuple<EntityKey<M,CN>>;
}

/**
 * Represents a Schema, which combines definitions of classes, structures and type aliases.
 */
export type ASchemaDef =
{
    classes: { [CN: string]: AClassDef }
    structs: { [SN: string]: AStructDef}
}

/**
 * Represents a Schema, which combines definitions of classes, structures and type aliases.
 */
export type SchemaDef<M extends AModel> = ASchemaDef &
{
    classes: { [CN in ModelClassName<M>]: ClassDef<M, CN> }
    structs: { [SN in ModelStructName<M>]: StructDef<M, SN>}
}



