import {
    PropType, MultiLink, Model, ModelClassName, KeyOfClass, ModelClass, ModelStructName,
    ModelStruct, StructType, NameOfClass
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
export type DataTypeOfPropType<T extends PropType> =
    T extends string ? "s" | "d" :
    T extends number ? "i1" | "i2" | "i4" | "i8" | "u1" | "u2" | "u4" | "u8" | "r4" | "r8" :
    T extends BigInt ? "i8" | "u8" :
    T extends boolean ? "b" :
    T extends Array<any> ? "arr" :
    T extends MultiLink ? "ml" :
    T extends StructType ? "struct" | "l" :
    never

/**
 * Defines property definition attributes that are common for all data types
 */
export type CommonPropDef =
{
    dt: DataType;

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
 * Contains attributes defining behavior of a structure field
 */
export type StructPropDef<T extends StructType> = CommonPropDef &
{
    dt: "struct";
    props: StructDef<T>;
}

/**
 * Contains attributes defining behavior of a structure field
 */
export type ArrayPropDef<TElm> = CommonPropDef &
{
    dt: "arr";
    elm: PropDef<TElm>;
}

/**
 * Contains attributes defining behavior of a single link field.
 * @typeParam TClass class that is a target of the link.
 */
export type LinkPropDef<TClass> = CommonPropDef &
{
    dt: "l";
    target: NameOfClass<TClass>,
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
 * Contains attributes defining behavior of a field of a given TypeScript type.
 */
export type PropDef<T> =
(
    T extends string ? StringPropDef :
    T extends number ? NumberPropDef :
    T extends BigInt ? BigIntPropDef :
    T extends boolean ? BoolPropDef :
    T extends Array<infer TElm> ? ArrayPropDef<TElm> :
    T extends MultiLink<infer TClass> ? MultiLinkPropDef<TClass> :
    T extends StructType ? LinkPropDef<T> | StructPropDef<T> :
    never
);

/**
 * Represents definition of a structured type, which defines property names and corresponding
 * property definitions. Structure definitions can be used to define class properties or to
 * serve as a "base" for a class. In the latter case, the class will have all the proprties
 * that the structure defines.
 */
export type StructDef<TStruct extends StructType> =
{
    [P in keyof TStruct & string]-?: PropDef<TStruct[P]>
}

/**
 * Represents definition of a class.
 */
export type ClassDef<TClass extends StructType> =
{
    /**
     * Defines one or more base classes or structures.
     */
    base?: string | string[];

    /**
     * Defenitions of class properties
     */
    props: StructDef<TClass>;

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
        ClassDef<ModelClass<TModel,TName> extends StructType ? ModelClass<TModel,TName> : never>}
    structs: { [TName in ModelStructName<TModel>]:
        StructDef<ModelStruct<TModel,TName> extends StructType ? ModelStruct<TModel,TName> : never>}
}



