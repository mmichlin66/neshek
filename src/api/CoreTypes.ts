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
export type PropType<T = any> =
    T extends ScalarType ? T :
    T extends (infer U)[] ? U[] :
    T extends {} ? StructType<T> :
    never;

// export type PropType<T = any> =
//     T extends ScalarType ? T :
//     T extends (infer U)[] ? U[] :
//     T extends {} ? { [P in keyof T]: PropType<T[P]> } :
//     never;

/**
 * Represents objects containing properties of allowed types.
 */
export type StructType<T extends {} = any> = { [P in keyof T]: PropType<T[P]> }

// /**
//  * Maps class names to class interfaces
//  */
// export type ClassTypes = { [P: string]: StructType }

// /**
//  * Maps structure type names to structure type interfaces
//  */
// export type StructTypes = { [P: string]: StructType }

export interface SchemaTypes<TClasses extends {} = {}, TStructs extends {} = {}>
{
    classes: TClasses;
    structs: TStructs;
}



/**
 * Represents underlying data type corresponding to the given property type
 */
export type DataType<T extends any> =
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
    choices?: number[];
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
export type StructPropDef<S extends SchemaTypes, T extends {}> = CommonPropDef &
{
    dt: "struct";
    props: StructDef<S,T>;
}

/**
 * Contains attributes defining behavior of a structure field
 */
export type ArrayPropDef<S extends SchemaTypes, T> = CommonPropDef &
{
    dt: "arr";
    elm: PropDef<S,T>;
}

/**
 * Contains attributes defining behavior of a single link field
 */
export type LinkPropDef<S extends SchemaTypes> = CommonPropDef &
{
    dt: "l";
    target: keyof S["classes"] | keyof S["classes"][],
}

/**
 * Contains attributes defining behavior of a multi link field pointing to a class or crosslink.
 */
export type MultiLinkPropDef<S extends SchemaTypes, T> = CommonPropDef &
{
    dt: "ml";
    origin: [keyof S["classes"], keyof T];
}

/**
 * Contains attributes defining behavior of a field of a given TypeScript type.
 */
export type PropDef<S extends SchemaTypes, T extends any> =
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
export type StructDef<S extends SchemaTypes, T extends {}> = { [P in keyof T]: PropDef<S,T[P]> };

/**
 * Represents definition of a class.
 */
export type ClassDef<S extends SchemaTypes, T extends {}> =
{
    /**
     * Defenitions of class properties
     */
    props: StructDef<S,T>;

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
     * Defines a primary key for the class. The key can be a single field or a collection of
     * fields. The `false` value indicates that the class doesn't have a primary key at all.
     * If the `key` property is undefined and the class defines property named `id`, then it is
     * used as a primary key.
     */
    key?: false | keyof T | (keyof T)[];
}

export type Schema<S extends SchemaTypes> =
{
    classes: { [P in keyof S["classes"]]: ClassDef<S, S["classes"][P] extends {} ? S["classes"][P] : never>}
    structs: { [P in keyof S["structs"]]: StructDef<S, S["structs"][P] extends {} ? S["structs"][P] : never>}
}


