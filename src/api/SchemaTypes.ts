import { DataType } from "./BasicTypes";
import {
    MultiLink, ModelClassName, ModelStructName, ModelStruct, NameOfClass,
    AModel, AClass, EntityKey, Entity, EntityPropName
} from "./ModelTypes";



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



