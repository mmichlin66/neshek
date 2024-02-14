import {
    PropType, MultiLink, Model, ModelClassName, KeyOfClass, ModelClass, ModelStructName,
    ModelStruct, StructType, NameOfClass, Class, Struct
} from "./ModelTypes";
import { KeysToTuple } from "./UtilTypes";

/**
 * Represents underlying data type corresponding to the given property type
 */
export type DataType =
    "s" | "b" | "i1" | "i2" | "i4" | "i8" | "u1" | "u2" | "u4" | "u8" | "r4" | "r8" |
    "d" | "t" | "struct" | "arr" | "l" | "ml";

/**
 * Represents underlying data type corresponding to the given property type
 */
export type DataTypeOfPropType<TModel extends Model, T extends PropType> =
    T extends string ? "s" | "d" :
    T extends number ? "i1" | "i2" | "i4" | "i8" | "u1" | "u2" | "u4" | "u8" | "r4" | "r8" :
    T extends BigInt ? "i8" | "u8" :
    T extends boolean ? "b" :
    T extends Array<any> ? "arr" :
    T extends MultiLink ? "ml" :
    T extends Class<infer TName, infer TKey> ? TName extends keyof TModel["classes"]
        ? "l"
        : T extends StructType ? "struct" : never :
    T extends StructType ? "struct" :
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
 * Contains attributes defining behavior of a string field
 */
export type StringPropDef = CommonPropDef &
{
    dt: "s";
    minlen?: number;
    maxlen?: number;
    regex?: RegExp;
    choices?: string[];
}

/**
 * Contains attributes defining behavior of a number field
 */
export type NumberPropDef = CommonPropDef &
{
    dt: "i1" | "i2" | "i4" | "i8" | "u1" | "u2" | "u4" | "u8"| "r4" | "r8";
    min?: number;
    max?: number;
    step?: number;
    choices?: number[];
}

/**
 * Contains attributes defining behavior of a BigInt field
 */
export type BigIntPropDef = CommonPropDef &
{
    dt: "i8" | "u8";
    min?: BigInt;
    max?: BigInt;
}

/**
 * Contains attributes defining behavior of a Boolean field
 */
export type BoolPropDef = CommonPropDef &
{
    dt: "b";
}

/**
 * Contains attributes defining behavior of a time field
 */
export type TimePropDef = CommonPropDef &
{
    dt: "t";
    precision?: "h" | "m" | "s" | "ms" | "ns";
}

/**
 * Contains attributes defining behavior of a structure field
 */
export type ArrayPropDef<TModel extends Model, TElm> = CommonPropDef &
{
    dt: "arr";
    elm: PropDef<TModel, TElm>;
}

/**
 * Contains attributes defining behavior of a single link field.
 * @typeParam TClass class that is a target of the link.
 */
export type LinkPropDef<TName extends string, TKey extends StructType> = CommonPropDef &
{
    dt: "l";
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
 * Contains attributes defining behavior of a multi link field pointing to a class or crosslink.
 * @typeParam TClass class that is a target of the multi link; that is, the origin of the
 * corresponding single link.
 *
 */
export type MultiLinkPropDef<TClass> = CommonPropDef &
{
    dt: "ml";
    origin: NameOfClass<TClass>;
    originKey: (keyof KeyOfClass<TClass>)[];
}

/**
 * Contains attributes defining behavior of a structure field
 */
export type StructPropDef<TModel extends Model, T> = CommonPropDef & {dt: "struct"} & (
    T extends Struct<infer TName> ? TName extends keyof TModel["structs"]
        ? {name: TName}
        : T extends StructType ? {props: StructDef<TModel, T>} : never :
    T extends StructType ? {props: StructDef<TModel, T>} :
    never)

/**
 * Represents attributes defining behavior of a field of a given type.
 */
export type PropDef<TModel extends Model, T> =
(
    T extends string ? StringPropDef :
    T extends number ? NumberPropDef :
    T extends BigInt ? BigIntPropDef :
    T extends boolean ? BoolPropDef :
    T extends Date ? TimePropDef :
    T extends Array<infer TElm> ? ArrayPropDef<TModel, TElm> :
    T extends MultiLink<infer TClass> ? MultiLinkPropDef<TClass> :
    T extends Class<infer TName, infer TKey> ? TName extends keyof TModel["classes"]
        ? LinkPropDef<TName, TKey>
        : T extends StructType ? StructPropDef<TModel, T> : never :
    T extends StructType ? StructPropDef<TModel, T> :
    never
);

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
export type ClassDef<TModel extends Model, TClass extends StructType> =
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
export type SchemaDef<TModel extends Model = {classes: {}, structs: {}}> =
{
    classes: { [TName in ModelClassName<TModel>]:
        ClassDef<TModel, ModelClass<TModel,TName> extends StructType ? ModelClass<TModel,TName> : never>}
    structs: { [TName in ModelStructName<TModel>]:
        StructDef<TModel, ModelStruct<TModel,TName> extends StructType ? ModelStruct<TModel,TName> : never>}
}



