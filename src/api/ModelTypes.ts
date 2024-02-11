/**
 * Represents simple scalar types allowed for object properties.
 */
export type ScalarType = string | number | boolean | bigint;

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
export type PropType = ScalarType | Array<PropType> | MultiLink | StructType | NeshekClass<any>;

/**
 * Represents a structure (object) with restricted property types.
 */
export type StructType = { [P: string]: PropType }

/** Extracts type for property names of the given stucture type */
export type StructTypePropName<T> = T extends StructType ? keyof T : never;

/**
 * Represents a multi link to a given class.
 */
export type MultiLink<TClass extends StructType = any> =
{
    /** Array of objects of the given class */
    elms?: TClass[];

    /**
     * Cursor that can be used to retrieve additional objects. If cursor is undefined, there
     * is no more data.
     */
    cursor?: string;
}



/** Represents a Scalar type or undefined. */
export type ScalarOrUndefined = ScalarType | undefined;

/** Represents a structure type or undefined. */
export type StructOrUndefined = StructType | undefined;

/** Represents an array type or undefined. */
export type PropOrUndefined = PropType | undefined;



/**
 * Symbol used only to make some information to be part of class type. This iformation includes
 * class name, primary key and unique constraints. We use symbol to be able to not enumerate it
 * using `keyof T & string`.
 * @internal
 */
export const symNeshekClass = Symbol();

/**
 * Represents type information "assigned" to the symNeshekClass symbol. It includes class name,
 * primary key and unique constraints.
 * @internal
 */
export type NeshekClassInfo<TName extends string, TKey extends StructType,
    TUnique extends StructType[]> =
{
    name: TName;
    key?: TKey;
    unique?: TUnique;
}

/**
 * Type from which all types representing Neshek model classes should derive.
 * @typeParam TName name of the class by which the class can be referred to when invoking
 * repository operations. This name most likely will be the name of the table used in the
 * repository. Usually this name is the same as the TypeScript class name.
 * @typeParam TKey type representing the primary key of the class. All properties of this type
 * become properties of the class, so they should not be repeated in the type body. If the class
 * doesn't have primary key, specify `{}`, which is also a default of this parameter.
 * @typeParam TUnique type representing unique constraints of the class. Properties of all
 * constraints become properties of the class, so they should not be repeated in the type body.
 * If the class doesn't have primary key, specify `[]`, which is also a default of this parameter.
 */
export type NeshekClass<TName extends string, TKey extends StructType = any, TUnique extends StructType[] = any> =
    { [P in keyof TKey]?: TKey[P] } &
    { [symNeshekClass]?: NeshekClassInfo<TName, TKey, TUnique> }



/**
 * Interface that combines interface definitions of classes, structures and type aliases.
 */
export type Model<TClasses extends { [P: string]: StructType } = any,
    TStructs extends { [P: string]: StructType } = any> =
{
    classes: TClasses;
    structs: TStructs;
}

/** Extracts `classes` object's type from the `Model` type */
export type ModelClasses<TModel extends Model> =
    TModel extends Model<infer TClasses, {}> ? TClasses : never;

/** Extracts type representing names of classes from the `Model` type */
export type ModelClassName<TModel extends Model> = string & keyof ModelClasses<TModel>;

/** Extracts type representing the classes with the given name from the `Model` type */
export type ModelClass<TModel extends Model, TName extends ModelClassName<TModel>> =
    ModelClasses<TModel>[TName];

/** Extracts `structs` object's type from the `Model` type */
export type ModelStructs<TModel extends Model> =
    TModel extends Model<{}, infer TStructs> ? TStructs : never;

/** Extracts type representing names of structures from the `Model` type */
export type ModelStructName<TModel extends Model> = keyof ModelStructs<TModel>;

/** Extracts type representing the structure with the given name from the `Model` type */
export type ModelStruct<TModel extends Model, TName extends ModelStructName<TModel>> =
    ModelStructs<TModel>[TName];

/** Extracts class name type from the given class type */
export type NameOfClass<TClass> = TClass extends NeshekClass<infer TName> ? TName : never;

/**
 * Extracts primary key type of the given Model class type. For cross-link classes, it is a
 * combination of primary keys of the linked classes.
 */
export type KeyOfModelClass<TClass> = TClass extends NeshekClass<infer TName, infer TKey>
    ? { [P in keyof TKey]-?: TKey[P] extends NeshekClass<infer TName, infer TNestedClass>
        ? KeyOfModelClass<TNestedClass>
        : TKey[P] }
    : never;



