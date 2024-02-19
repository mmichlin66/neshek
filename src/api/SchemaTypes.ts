import {
    PropType, MultiLink, Model, ModelClassName, KeyOfClass, ModelClass, ModelStructName,
    ModelStruct, StructType, NameOfClass, Class, Struct
} from "./ModelTypes";
import { KeysToTuple, XOR } from "./UtilTypes";

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
export type DataTypeOfPropType<TModel extends Model, T extends PropType> =
    T extends string ? "str" | "date" | "time" | "datetime" :
    T extends number ? "int" | "real" | "dec" | "bit" | "ts" :
    T extends bigint ? "bigint" | "dec" | "bit" | "ts" :
    T extends boolean ? "bool" :
    T extends Date ? "timestamp" :
    T extends Array<any> ? "arr" :
    T extends MultiLink ? "multilink" :
    T extends Class<infer TName> ? TName extends keyof TModel["classes"]
        ? "link"
        : T extends StructType ? "obj" : never :
    T extends StructType ? "obj" :
    never

// type C = Class<"C"> & {a?: string};
// type S = Struct<"S">;
// type M = Model<[C], [S]>

// let dt1: DataTypeOfPropType<M,C>;
// let dt2: DataTypeOfPropType<Model,S>;
// let dt3: DataTypeOfPropType<Model, {a: string}>;



/**
 * Transforms the given primary key object to an object with the same properties and string values.
 * This type is needed for single links to specify field names in the table with the foreign key.
 * For example, if the primary key of the Order object is {id: number}, the corresponding field
 * in the table with the foreign key might be named "order_id".
 */
export type ForeignKeyFields<TKey extends object> =
    { [P in keyof TKey & string]: TKey[P] extends Class<any, infer TNestedKey>
        ? ForeignKeyFields<TNestedKey> : string }



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
     * Determines whether the field value must be unique across all objects of its class.
     * Default value: false.
     */
    unique?: boolean;

    /**
     * Determines whether the field must have a non-null value in the repository.
     * Default value: false.
     */
    required?: boolean;
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

/**
 * Contains attributes defining behavior of a structure property
 */
export type ArrayPropDef<TModel extends Model, TElm> = CommonPropDef &
{
    dt: "arr";
    elm: PropDef<TModel, TElm>;
}

/**
 * Contains attributes defining behavior of a single link property.
 * @typeParam TClass class that is a target of the link.
 */
export type LinkPropDef<TName extends string, TKey extends StructType> = CommonPropDef &
{
    dt: "link";
    target: TName;

    /**
     * Property name(s) that keep the primary key of the target object. This is represented as
     * an object whose keys are the property names of the target's primary key and the values
     * are property names. The `keyProps` structure is recursive to support cases when a property
     * of the target's primary key consists of more than one fields.
     *
     * **Example:**
     * ```typescript
     * // primary key with one field
     * {id: "orderID"}
     *
     * // primary key with two fields
     * {firstName: "personFirstName", lastName: "personLastName", dob: "personDOB"}
     *
     * // hierarchical primary key (e.g to a cross link)
     * {order: {id: "orderID"}, product: {code: "productCode"}}
     * ```
     */
    keyProps: ForeignKeyFields<TKey>;
}

/**
 * Contains attributes defining behavior of a multi link property pointing to a class or crosslink.
 * @typeParam TClass class that is a target of the multi link; that is, the origin of the
 * corresponding single link.
 *
 */
export type MultiLinkPropDef<TClass> = CommonPropDef &
{
    dt: "multilink";
    origin: NameOfClass<TClass>;
    originKey: keyof TClass;
}

/**
 * Contains attributes defining behavior of a structure property
 */
export type StructPropDef<TModel extends Model, T> = CommonPropDef & {dt: "obj"} & (
    T extends Struct<infer TName> ? TName extends keyof TModel["structs"]
        ? {name: TName}
        : T extends StructType ? {props: StructDef<TModel, T>} : never :
    T extends StructType ? {props: StructDef<TModel, T>} :
    never)

/**
 * Represents attributes defining behavior of a property of a given type.
 */
export type PropDef<TModel extends Model = any, T = any> =
    T extends string ? StringPropDef | DatePropDef | TimePropDef | DateTimePropDef :
    T extends number ? IntPropDef | RealPropDef | DecimalPropDef | BitValuePropDef | TimestampPropDef :
    T extends bigint ? BigIntPropDef | DecimalPropDef | BitValuePropDef | TimestampPropDef :
    T extends boolean ? BoolPropDef :
    T extends Date ? TimestampPropDef :
    T extends Array<infer TElm> ? ArrayPropDef<TModel, TElm> :
    T extends MultiLink<infer TClass> ? MultiLinkPropDef<TClass> :
    T extends Class<infer TName, infer TKey> ? TName extends keyof TModel["classes"]
        ? LinkPropDef<TName, TKey>
        : T extends StructType ? StructPropDef<TModel, T> : never :
    T extends StructType ? StructPropDef<TModel, T> :
    never

/**
 * Represents definition of a structured type, which defines property names and corresponding
 * property definitions. Structure definitions can be used to define class properties or to
 * serve as a "base" for a class. In the latter case, the class will have all the proprties
 * that the structure defines.
 */
export type StructDef<TModel extends Model, TStruct extends StructType> =
{
    [P in keyof TStruct & string]-?: PropDef<TModel, TStruct[P]>
}

/**
 * Represents definition of a class.
 */
export type ClassDef<TModel extends Model = any, TClass extends Class<string> = any> =
{
    /**
     * Defines one or more base classes or structures.
     */
    base?: string | string[];

    /**
     * Defenitions of class properties
     */
    props: StructDef<TModel, TClass>;

    /**
     * Defines what fields constitute a primary key for the class. The key can be a single field
     * or a collection of fields.
     */
    key?: KeysToTuple<KeyOfClass<TClass>>;

    /**
     * If the class is declared abstract, no instances of it can be created in the repository.
     * It can only be used as a base for other classes.
     */
    abstract?: boolean;
}

/**
 * Represents a Schema, which combines definitions of classes, structures and type aliases.
 */
export type SchemaDef<TModel extends Model> =
{
    classes: { [TName in ModelClassName<TModel>]:
        ClassDef<TModel, ModelClass<TModel,TName> extends StructType ? ModelClass<TModel,TName> : never>}
    structs: { [TName in ModelStructName<TModel>]:
        StructDef<TModel, ModelStruct<TModel,TName> extends StructType ? ModelStruct<TModel,TName> : never>}
}



