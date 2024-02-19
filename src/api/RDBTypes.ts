import {
    Class, KeyOfClass, Model, ModelClass, ModelClassName, MultiLink, ScalarType, StructType
} from "./ModelTypes";
import { ClassDef, PropDef } from "./SchemaTypes";



/**
 * Represents optional information on how the Model should be applied to a relational data base.
 * This allows providing table names for classes, field names for linked objects' primary keys
 * and other parameters.
 */
export type RDBSchemaHints<TModel extends Model = any> =
{
    /**
     * Default function that generates a table name for the given class name. This function is
     * invoked only if the table name was not provided explicitly in the RDB class definition.
     * If this function is undefined or if it returns undefined, the table name is just the class
     * name.
     *
     * An example of such function can be "pluralization", e.g. appending "s" to the class name
     * (and "es" if the class name already ends with "s"; and replacing the last "y" with "ies").
     *
     * @param className Class name for which table name should be returned
     * @returns Table name
     */
    tableNameFunc?: (className: string) => string | undefined;

    /**
     * Default function that generates column type based on property definition. This function is
     * invoked only if the column type is not provide explicitly in the RDB property definition.
     * @param propDef Property definition
     * @returns Column type string
     */
    columnTypeFunc?: (propDef: PropDef) => string;

    /** Hints for individual classes */
    classes?: { [TName in ModelClassName<TModel>]:
        RDBClassHints<TModel, ModelClass<TModel, TName> extends Class<TName> ? ModelClass<TModel, TName> : never>}
}

/**
 * Represents information on how the class structure from the model should be applied to a
 * relational data base.
 */
export type RDBClassHints<TModel extends Model = any, TClass extends Class<string> = any> =
{
    /**
     * Name of the table to keep class instances. If this property is undefined, the table name
     * will be determined either by calling the function from the {@RDBSchemaHints} definition
     * or, if the latter is undefined too, equal to the class name.
     */
    tableName?: string;

    /** Hints for individual properties */
    props?: { [TPropName in string & keyof TClass]?: RDBPropHints<TModel, TClass[TPropName]> }
}

// PropDef<TModel, ModelClass<TModel, TClassName>[TPropName]>

/**
 * Represents information on how the property structure from the model should be applied to a
 * relational data base.
 */
export type RDBPropHints<TModel extends Model = any, T = any> =
    T extends ScalarType ? RDBScalarPropHints :
    T extends Array<infer TElm> ? RDBScalarPropHints :
    T extends MultiLink<infer TClass> ? never :
    T extends Class<infer TName> ? TName extends keyof TModel["classes"]
        ? RDBLinkPropHints<KeyOfClass<T>>
        : T extends StructType ? RDBScalarPropHints : never :
    T extends StructType ? RDBScalarPropHints :
    never

/**
 * Represents information that can be provided for scalar properties of a class
 */
export type RDBCommonPropHints =
{
    /** Name of the field. If omitted, the name will be equal to the property name. */
    name?: string;

    /** Name of the field's data type. */
    columnType?: string;
}

/**
 * Represents information that can be provided for scalar properties of a class
 */
export type RDBScalarPropHints = RDBCommonPropHints

/**
 * Represents information that can be provided for link properties of a class. Link properties in
 * the model are represented as objects of the target class. Since keys in the target class can
 * consist of more than one property and since any of these properties can also be links, the
 * actual foreign key may consists of multiple fields. For each of these fields we need to provide
 * field name and type.
 */
export type RDBLinkPropHints<TKey extends object> =
{
    [P in keyof TKey & string]:
        // TKey[P] extends ScalarType ? RDBScalarPropHints :
        TKey[P] extends Class<any, infer TNestedKey> ? RDBLinkPropHints<TNestedKey> :
        RDBScalarPropHints
}



/**
 * Processed schema that keeps all the necessary information about the database structure.
 */
export type RDBSchema = { [P: string]: RDBClass }

/**
 * Information about class in the processed schema
 */
export type RDBClass =
{
    /** Class name */
    name: string;

    /** Class definition */
    classDef: ClassDef;

    /** Table name */
    table: string;

    /** Information about properties */
    props: { [P: string]: RDBProp };

    /**
     * Maps names of fields constituting the class primary key, to arrays of property names to
     * get to the value of the appropriate key part. If the class doesn't have primary key, this
     * value is undefined.
     *
     * **Examples:**
     * - If primary key is defined as `{id: number}` and the field is not redefined, the value
     *   will be `{id: ["id"]}`.
     * - If primary key is defined as `{p1: string, p2: number}` and the field names are redefined
     *   as `part1` and `part2`, the value will be `{part1: ["p1"], part2: ["p2"]}`.
     * - If a link is part of the primary key, for example, `{product: Product}` where Product's
     *   primary key is `{code: string}` and the field for `product` is redefined as `product_code`,
     *   the value will be `{product_code: ["product", "code"]}`.
     */
    key?: { [P: string]: string[] };
}

/**
 * Information about class property in the processed schema
 */
export type RDBProp =
{
    /** Property name */
    name: string;

    /** Property definition from the schema definition */
    propDef: PropDef;

    /**
     * If the property is a scalar, then this is field name. If the property is a link, then this
     * is an object where the keys are field names and the values are arrays of property names to
     * get to the value of the appropriate key part. This property is undefined for multi-links.
     */
    field?: string | RDBLinkFields;

    // /**
    //  * ???
    //  * Flag indicating that the property is implemented by more than one database field. This can
    //  * occur if the property is a link to an object whose key consists of more than one properties.
    //  * This property is undefined otherwise, with meaning equal to that of `false`.
    //  */
    // isMultiField?: boolean;

    /**
     * Database-specific type of the field corresponding to the property. This can be undefined
     * if the property is a link, which consists of more than one field, or if it is a multi-link.
     */
    ft?: string;
}



/**
 * Represents the fields constituting a foreign key, which is an object where the keys are field
 * names and the values are arrays of property names to get to the value of the appropriate key
 * part.
 */
export type RDBLinkFields = Record<string, RDBLinkField>;

/**
 * Information about single-link property in the processed schema. It contains information about
 * the field(s) constituting the foreign key and their types. In addition, it has a chain of
 * property names of nested keys - in case the key of a target class itself contains a foreign key.
 */
export type RDBLinkField =
{
    /**
     * Array of property names of linked objects` keys up to the scalar property.
     */
    propChain: string[];

    /**
     * Database-specific type of the field corresponding to the property. This can be undefined
     * if the property is a link, which consists of more than one field, or if it is a multi-link.
     */
    ft: string;
}



