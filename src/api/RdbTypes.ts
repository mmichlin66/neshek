import {
    AModel, Entity, EntityKey, EntityPropName, KeyType, ModelClassName, MultiLink, ScalarType
} from "./ModelTypes";
import { AClassDef, APropDef, PropDef } from "./SchemaTypes";



/**
 * Represents optional information on how the Model should be applied to a relational data base.
 * This allows providing table names for classes, field names for linked objects' primary keys
 * and other parameters.
 */
export type ARdbSchemaHints =
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
     * Default function that generates field type based on property definition. This function is
     * invoked only if the field type is not provide explicitly in the RDB property definition.
     * @param propDef Property definition
     * @returns Field type string
     */
    fieldTypeFunc?: (propDef: APropDef) => string;

    /** Hints for individual classes */
    classes?: { [CN: string]: ARdbClassHints}
}

/**
 * Represents optional information on how the Model should be applied to a relational data base.
 * This allows providing table names for classes, field names for linked objects' primary keys
 * and other parameters.
 */
export type RdbSchemaHints<M extends AModel> = ARdbSchemaHints &
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
    tableNameFunc?: (className: ModelClassName<M>) => string | undefined;

    /**
     * Default function that generates field type based on property definition. This function is
     * invoked only if the field type is not provide explicitly in the RDB property definition.
     * @param propDef Property definition
     * @returns Field type string
     */
    fieldTypeFunc?: <T>(propDef: PropDef<M,T>) => string;

    /** Hints for individual classes */
    classes?: { [CN in ModelClassName<M>]: RDBClassHints<M,CN>}
}



/**
 * Helper type with all template parameters set to `any`. This is needed for easier referencing
 * in other type definitions.
 */
export type ARdbClassHints =
{
    /**
     * Name of the table to keep class instances. If this property is undefined, the table name
     * will be determined either by calling the function from the {@RDBSchemaHints} definition
     * or, if the latter is undefined too, equal to the class name.
     */
    tableName?: string;

    /** Hints for individual properties */
    props?: { [PN: string]: ARdbPropHints }
}

/**
 * Represents information on how the class structure from the model should be applied to a
 * relational data base.
 */
export type RDBClassHints<M extends AModel, CN extends ModelClassName<M>> = ARdbClassHints &
{
    /** Hints for individual properties */
    props?: { [PN in EntityPropName<M,CN>]?: RdbPropHints<M, Entity<M,CN>[PN]> }
}



/**
 * Helper type with all template parameters set to `any`. This is needed for easier referencing
 * in other type definitions.
 */
export type ARdbPropHints = RdbScalarPropHints | ARdbLinkPropHints;

/**
 * Represents information on how the property structure from the model should be applied to a
 * relational data base.
 */
export type RdbPropHints<M extends AModel, T> = ARdbPropHints &
(
    T extends ScalarType ? RdbScalarPropHints :
    // T extends Array<infer E> ? RDBScalarPropHints :
    T extends MultiLink<any> ? never :
    T extends Entity<M, infer CN> ? CN extends ModelClassName<M>
        ? RdbLinkPropHints<EntityKey<M,CN>>
        : never :
    //     : T extends StructType ? RDBScalarPropHints : never :
    // T extends StructType ? RDBScalarPropHints :
    never
);



/**
 * Represents information that can be provided for scalar properties of a class
 */
export type RdbCommonPropHints =
{
    /** Name of the field. If omitted, the name will be equal to the property name. */
    name?: string;

    /** Name of the field's data type. */
    ft?: string;
}



/**
 * Represents information that can be provided for scalar properties of a class
 */
export type RdbScalarPropHints = RdbCommonPropHints



/**
 * Helper type with all template parameters set to `any`. This is needed for easier referencing
 * in other type definitions.
 */
export type ARdbLinkPropHints =
{
    [P: string]: RdbScalarPropHints | ARdbLinkPropHints
}

/**
 * Represents information that can be provided for link properties of a class. Link properties in
 * the model are represented as objects of the target class. Since keys in the target class can
 * consist of more than one property and since any of these properties can also be links, the
 * actual foreign key may consists of multiple fields. For each of these fields we need to provide
 * field name and type.
 */
export type RdbLinkPropHints<K extends KeyType> = ARdbLinkPropHints &
{
    [P in string & keyof K]:
        K[P] extends ScalarType ? RdbScalarPropHints :
        K[P] extends KeyType ? RdbLinkPropHints<K[P]> :
        never
}



/**
 * Processed schema that keeps all the necessary information about the database structure.
 */
export type RdbSchema = { [P: string]: RdbClass }

/**
 * Information about class in the processed schema
 */
export type RdbClass =
{
    /** Class name */
    name: string;

    /** Class definition */
    classDef: AClassDef;

    /** Table name */
    table: string;

    /** Information about properties */
    props: { [P: string]: RdbProp };

    // /**
    //  * Maps names of fields constituting the class primary key, to arrays of property names to
    //  * get to the value of the appropriate key part. If the class doesn't have primary key, this
    //  * value is undefined.
    //  *
    //  * **Examples:**
    //  * - If primary key is defined as `{id: number}` and the field is not redefined, the value
    //  *   will be `{id: ["id"]}`.
    //  * - If primary key is defined as `{p1: string, p2: number}` and the field names are redefined
    //  *   as `part1` and `part2`, the value will be `{part1: ["p1"], part2: ["p2"]}`.
    //  * - If a link is part of the primary key, for example, `{product: Product}` where Product's
    //  *   primary key is `{code: string}` and the field for `product` is redefined as `product_code`,
    //  *   the value will be `{product_code: ["product", "code"]}`.
    //  */
    // key?: { [P: string]: string[] };
}

/**
 * Information about class property in the processed schema
 */
export type RdbProp =
{
    /** Property name */
    name: string;

    /** Property definition from the schema definition */
    propDef: APropDef;

    /**
     * If the property is a scalar, then this is field name. If the property is a link, then this
     * is an object where the keys are field names and the values are arrays of property names to
     * get to the value of the appropriate key part. This property is undefined for multi-links.
     */
    field?: string | Record<string, RdbLinkField>;

    /**
     * Database-specific type of the field corresponding to the property. This is undefined for
     * link and multi-link properties. For link properties, the field type is specified in the
     * object pointed to by the `field` property. For multi-links, there is no field(s) that holds
     * any data.
     */
    ft?: string;
}



/**
 * Information about single-link property in the processed schema. It contains information about
 * the field(s) constituting the foreign key and their types. In addition, it has a chain of
 * property names of nested keys - in case the key of a target class itself contains a foreign key.
 */
export type RdbLinkField =
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



