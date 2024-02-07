/**
 * Represents simple scalar types allowed for object properties.
 */
export type ScalarType = string | number | boolean | BigInt;

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
export type PropType = ScalarType | Array<PropType> | StructType;

/**
 * Represents a structure (object) with restricted property types.
 */
export type StructType = { [P: string]: PropType }

/** Extracts type for property names of the given stucture type */
export type StructTypePropName<T> = T extends StructType ? keyof T : never;



// /**
//  * Interface from which all interfaces representing schema classes should derive and pass the
//  * type of their primary key as the type parameter. The key type can be one of the following:
//  * - number - the primary key is a single field of the number type. This is a default type.
//  * - string - the primary key is a single field ofthe string type.
//  * - array consisting of numbers and/or string types - the primary key is a combination of two
//  *   or more fields of the given types.
//  * - undefined - the class doesn't have a primary key.
//  * 
//  */
// export interface ISchemaClass<T extends number | string | { [P: string]: number | string | boolean } | undefined = number>
// {
//     _pk_?: T;
// }

// /** Extracts key type of the given class type */
// export type SchemaClassKey<T> = T extends ISchemaClass<infer U> ? U : never;

// /**
//  * Represents a Cross Link type, which has links to the given class types.
//  */
// export interface ICrossLink<T1,T2> extends ISchemaClass<[
//             T1 extends ISchemaClass<infer K1> ? SchemaClassKey<K1> : never,
//             T2 extends ISchemaClass<infer K2> ? SchemaClassKey<K2> : never,
//         ]>
// {
// }

// export interface ICrossLink<T1,T2> extends ISchemaClass<[
//             T1 extends ISchemaClass<infer K1> ? SchemaClassKey<K1> : never,
//             T2 extends ISchemaClass<infer K2> ? SchemaClassKey<K2> : never,
//         ]>
// {
// }



/**
 * Interface that combines interface definitions of classes, structures and type aliases.
 */
export type Model<TClasses extends {} = {}, TStructs extends {} = {}> =
{
    classes: TClasses;
    structs: TStructs;
}

/** Extracts `classes` object's type from the `Model` type */
export type ModelClasses<TModel extends Model> = TModel extends Model<infer TClasses, {}> ? TClasses : never;

/** Extracts type representing names of classes from the `Model` type */
export type ModelClassName<TModel extends Model> = keyof ModelClasses<TModel>;

/** Extracts type representing the classes with the given name from the `Model` type */
export type ModelClass<TModel extends Model, TName extends ModelClassName<TModel>> = ModelClasses<TModel>[TName];

/** Extracts `structs` object's type from the `Model` type */
export type ModelStructs<TModel extends Model> = TModel extends Model<{}, infer TStructs> ? TStructs : never;

/** Extracts type representing names of structures from the `Model` type */
export type ModelStructName<TModel extends Model> = keyof ModelStructs<TModel>;

/** Extracts type representing the structure with the given name from the `Model` type */
export type ModelStruct<TModel extends Model, TName extends ModelStructName<TModel>> = ModelStructs<TModel>[TName];



/**
 * Represents underlying data type corresponding to the given property type
 */
export type DataType<T> =
    T extends string ? "s" :
    T extends number ? "i1" | "i2" | "i4" | "u1" | "u2" | "u4" | "f" | "d":
    T extends BigInt ? "i8" | "u8":
    T extends boolean ? "b" :
    T extends Array<any> ? "ml" | "arr" :
    T extends {} ? "l" | "struct" :
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
export type BoolIntPropDef = CommonPropDef &
{
    dt: "b";
}

/**
 * Contains attributes defining behavior of a structure field
 */
export type StructPropDef<S extends Model, T extends {}> = CommonPropDef &
{
    dt: "struct";
    props: StructDef<S,T>;
}

/**
 * Contains attributes defining behavior of a structure field
 */
export type ArrayPropDef<S extends Model, T> = CommonPropDef &
{
    dt: "arr";
    elm: PropDef<S,T>;
}

/**
 * Contains attributes defining behavior of a single link field
 */
export type LinkPropDef<S extends Model> = CommonPropDef &
{
    dt: "l";
    target: keyof S["classes"] | keyof S["classes"][],
}

/**
 * Contains attributes defining behavior of a multi link field pointing to a class or crosslink.
 */
export type MultiLinkPropDef<S extends Model, T> = CommonPropDef &
{
    dt: "ml";
    origin: [keyof S["classes"], keyof T];
}

/**
 * Contains attributes defining behavior of a field of a given TypeScript type.
 */
export type PropDef<S extends Model, T extends any> =
(
    T extends string ? StringPropDef :
    T extends number ? NumberPropDef :
    T extends BigInt ? BigIntPropDef :
    T extends boolean ? BoolIntPropDef :
    T extends Array<infer U> ? MultiLinkPropDef<S,U> | ArrayPropDef<S,U> :
    T extends {} ? LinkPropDef<S> | StructPropDef<S,T> :
    never
);

/**
 * Represents definition of a structured type, which defines property names and corresponding
 * property definitions. Structure definitions can be used to define class properties or to
 * serve as a "base" for a class. In the latter case, the class will have all the proprties
 * that the structure defines.
 */
export type StructDef<TModel extends Model, TStruct extends {}> =
{
    [P in keyof TStruct]: PropDef<TModel, TStruct[P]>
}

/**
 * Represents definition of a class.
 */
export type ClassDef<TModel extends Model, TClass extends {}> =
{
    /**
     * Defenitions of class properties
     */
    props: StructDef<TModel,TClass>;

    /**
     * If the class is declared abstract, no instances of it can be created in the repository.
     * It can only be used as a base for other classes.
     */
    abstract?: boolean;

    /**
     * Defines one or more base classes or structures.
     */
    base?: string | string[];

    /**
     * Defines what fields constitute a primary key for the class. The key can be a single field
     * or a collection of fields. The `false` value indicates that the class doesn't have a
     * primary key at all. If the `key` property is undefined and the class defines property named
     * `id`, then it is used as a primary key.
     */
    key?: false | keyof TClass | (keyof TClass)[];
}

/**
 * Represents a Schema, which combines definitions of classes, structures and type aliases.
 */
export type Schema<TModel extends Model = any> =
{
    classes: { [P in ModelClassName<TModel>]:
        ClassDef<TModel, ModelClass<TModel,P> extends {} ? ModelClass<TModel,P> : never>}
    structs: { [P in ModelStructName<TModel>]:
        StructDef<TModel, ModelStruct<TModel,P> extends {} ? ModelStruct<TModel,P> : never>}
}

/** Extracts the `Model` type from the given `Schema` type. */
export type SchemaModel<T> = T extends Schema<infer TModel> ? TModel : never;

export type SchemaClassKey<TSchema extends Schema, TName extends ModelClassName<SchemaModel<TSchema>>> = number;



