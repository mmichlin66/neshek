import {
    PropType, MultiLink, Model, ModelClassName, KeyOfModelClass, ModelClass, ModelStructName,
    ModelStruct, ModelClasses, ModelStructs, StructType, NameOfClass
} from "./ModelTypes";

/**
 * Represents underlying data type corresponding to the given property type
 */
export type DataType<T extends PropType> =
    T extends string ? "s" :
    T extends number ? "i1" | "i2" | "i4" | "u1" | "u2" | "u4" | "f" | "d":
    T extends BigInt ? "i8" | "u8":
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
    dt: "i1" | "i2" | "i4" | "i8" | "u1" | "u2" | "u4" | "u8"| "f" | "d";
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
export type StructPropDef<TModel extends Model, T extends StructType> = CommonPropDef &
{
    dt: "struct";
    props: StructDef<TModel,T>;
}

/**
 * Contains attributes defining behavior of a structure field
 */
export type ArrayPropDef<TModel extends Model, TElm> = CommonPropDef &
{
    dt: "arr";
    elm: PropDef<TModel,TElm>;
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
    originKey: (keyof KeyOfModelClass<TClass>)[];
}

/**
 * Contains attributes defining behavior of a field of a given TypeScript type.
 */
export type PropDef<TModel extends Model, T> =
(
    T extends string ? StringPropDef :
    T extends number ? NumberPropDef :
    T extends BigInt ? BigIntPropDef :
    T extends boolean ? BoolPropDef :
    T extends Array<infer TElm> ? ArrayPropDef<TModel,TElm> :
    T extends MultiLink<infer TClass> ? MultiLinkPropDef<TClass> :
    T extends StructType ? LinkPropDef<T> | StructPropDef<TModel,T> :
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
    props: StructDef<TModel,TClass>;

    /**
     * Defines what fields constitute a primary key for the class. The key can be a single field
     * or a collection of fields. The `false` value indicates that the class doesn't have a
     * primary key at all. If the `key` property is undefined and the class defines property named
     * `id`, then it is used as a primary key.
     */
    key?: (keyof KeyOfModelClass<TClass>)[];

    /**
     * If the class is declared abstract, no instances of it can be created in the repository.
     * It can only be used as a base for other classes.
     */
    abstract?: boolean;
}

/**
 * Represents a Schema, which combines definitions of classes, structures and type aliases.
 */
export type Schema<TModel extends Model = {classes: {}, structs: {}}> =
{
    classes: { [TName in ModelClassName<TModel>]:
        ClassDef<TModel, ModelClass<TModel,TName> extends StructType ? ModelClass<TModel,TName> : never>}
    structs: { [TName in ModelStructName<TModel>]:
        StructDef<TModel, ModelStruct<TModel,TName> extends StructType ? ModelStruct<TModel,TName> : never>}
}

/** Extracts the `Model` type from the given `Schema` type. */
export type SchemaModel<TSchema> = TSchema extends Schema<infer TModel> ? TModel : never;



/** Extracts `classes` object's type from the `Schema` type */
export type SchemaClasses<TSchema extends Schema> = ModelClasses<SchemaModel<TSchema>>;

/** Extracts type representing names of classes from the `Schema` type */
export type SchemaClassName<TSchema extends Schema> = ModelClassName<SchemaModel<TSchema>>;

/** Extracts type representing the classes with the given name from the `Schema` type */
export type SchemaClass<TSchema extends Schema, TName extends SchemaClassName<TSchema>> =
    ModelClass<SchemaModel<TSchema>, TName>;

/** Extracts `structs` object's type from the `Schema` type */
export type SchemaStructs<TSchema extends Schema> = ModelStructs<SchemaModel<TSchema>>;

/** Extracts type representing names of structures from the `Schema` type */
export type SchemaStructName<TSchema extends Schema> = ModelStructName<SchemaModel<TSchema>>;

/** Extracts type representing the structure with the given name from the `Schema` type */
export type SchemaStruct<TSchema extends Schema, TName extends SchemaStructName<TSchema>> =
    ModelStruct<SchemaModel<TSchema>, TName>;


/** Extracts type of primary key of the given Schema class type */
export type KeyOfSchemaClass<TSchema extends Schema, TName extends SchemaClassName<TSchema>> =
    KeyOfModelClass<SchemaClass<TSchema, TName>>;



