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



/**
 * Type from which all types representing schema classes should derive and pass the
 * type of their primary key as the type parameter.
 */
export type NeshekClass<TKey extends StructType> =
    { [P in keyof TKey]?: TKey[P] } & { readonly _key_?: TKey }



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
 * Extracts primary key type of the given Model class type. For cross-link classes, it is a
 * combination of primary keys of the linked classes.
 */
export type PKofModelClass<T> = T extends NeshekClass<infer U>
    ? { [P in keyof U]-?: U[P] extends NeshekClass<infer V> ? PKofModelClass<V> : U[P] }
    : never;

// export type PKofModelClass<T> = T extends NeshekClass<infer U>
//     ? { [P in keyof U]-?: U[P] extends NeshekClass<infer V> ? { [P in keyof V]-?: V[P] } : U[P] }
//     : never;



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
export type StructPropDef<TModel extends Model, T extends {}> = CommonPropDef &
{
    dt: "struct";
    props: StructDef<TModel,T>;
}

/**
 * Contains attributes defining behavior of a structure field
 */
export type ArrayPropDef<TModel extends Model, T> = CommonPropDef &
{
    dt: "arr";
    elm: PropDef<TModel,T>;
}

/**
 * Contains attributes defining behavior of a single link field
 */
export type LinkPropDef<TModel extends Model> = CommonPropDef &
{
    dt: "l";
    target: keyof TModel["classes"] | keyof TModel["classes"][],
}

/**
 * Contains attributes defining behavior of a multi link field pointing to a class or crosslink.
 */
export type MultiLinkPropDef<TModel extends Model, T> = CommonPropDef &
{
    dt: "ml";
    origin: [keyof TModel["classes"], keyof T];
}

/**
 * Contains attributes defining behavior of a field of a given TypeScript type.
 */
export type PropDef<TModel extends Model, T> =
(
    T extends string ? StringPropDef :
    T extends number ? NumberPropDef :
    T extends BigInt ? BigIntPropDef :
    T extends boolean ? BoolIntPropDef :
    T extends Array<infer U> ? MultiLinkPropDef<TModel,U> | ArrayPropDef<TModel,U> :
    T extends {} ? LinkPropDef<TModel> | StructPropDef<TModel,T> :
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
    key?: (keyof PKofModelClass<TClass>)[];

    /**
     * If the class is declared abstract, no instances of it can be created in the repository.
     * It can only be used as a base for other classes.
     */
    abstract?: boolean;
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
export type SchemaModel<TSchema> = TSchema extends Schema<infer TModel> ? TModel : never;



/** Extracts `classes` object's type from the `Schema` type */
export type SchemaClasses<TSchema extends Schema> = ModelClasses<SchemaModel<TSchema>>;

/** Extracts type representing names of classes from the `Schema` type */
export type SchemaClassName<TSchema extends Schema> = ModelClassName<SchemaModel<TSchema>>;

/** Extracts type representing the classes with the given name from the `Schema` type */
export type SchemaClass<TSchema extends Schema, TName extends SchemaClassName<TSchema>> = ModelClass<SchemaModel<TSchema>, TName>;

/** Extracts `structs` object's type from the `Schema` type */
export type SchemaStructs<TSchema extends Schema> = ModelStructs<SchemaModel<TSchema>>;

/** Extracts type representing names of structures from the `Schema` type */
export type SchemaStructName<TSchema extends Schema> = ModelStructName<SchemaModel<TSchema>>;

/** Extracts type representing the structure with the given name from the `Schema` type */
export type SchemaStruct<TSchema extends Schema, TName extends SchemaStructName<TSchema>> = ModelStruct<SchemaModel<TSchema>, TName>;


/** Extracts type of primary key of the given Schema class type */
export type PKofSchemaClass<TSchema extends Schema, TName extends SchemaClassName<TSchema>> =
    PKofModelClass<SchemaClass<TSchema, TName>>;



