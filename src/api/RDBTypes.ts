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



