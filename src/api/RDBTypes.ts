import { Class, DeepKeyOfClass, KeyOfClass, Model, ModelClass, ModelClassName, MultiLink, ScalarType, StructType } from "./ModelTypes";
import { PropDef } from "./SchemaTypes";



/**
 * Represents optional information on how the Model should be applied to a relational data base.
 * This allows providing table names for classes, field names for linked objects' primary keys
 * and other parameters.
 */
export type RDBSchemaHints<TModel extends Model> =
{
    /**
     * Default function that generates a table name for the given class name. This function is
     * invoked only if the table name was not provided explicitly in the RDB class definition.
     * If this function is undefined, the table name is just the class name. An example of such
     * function can be "pluralization", e.g. appending "s" to the class name (and "es" if the class
     * name already ends with "s"; and replacing the last "y" with "ies").
     * @param className Class name for which table name should be returned
     * @returns Table name
     */
    tableNameFunc?: (className: string) => string;

    /**
     * Default function that generates column type based on property definition. This function is
     * invoked only if the column type is not provide explicitly in the RDB property definition.
     * @param propDef Property definition
     * @returns Column type string
     */
    columnTypeFunc?: (propDef: PropDef<TModel, any>) => string;

    /** Hints for individual classes */
    classes?: { [TName in ModelClassName<TModel>]:
        RDBClassHints<TModel, ModelClass<TModel, TName> extends Class<TName> ? ModelClass<TModel, TName> : never>}
}

/**
 * Represents information on how the class structure from the model should be applied to a
 * relational data base.
 */
export type RDBClassHints<TModel extends Model, TClass extends Class<string>> =
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
export type RDBPropHints<TModel extends Model, T> =
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
    typeName?: string;
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
        TKey[P] extends ScalarType ? RDBScalarPropHints :
        TKey[P] extends Class<any, infer TNestedKey> ? RDBLinkPropHints<TNestedKey> :
        // TKey[P] extends Array<any> ? never :
        // TKey[P] extends MultiLink ? never :
        never
}



function testPropDefToColumnType<TModel extends Model>(propDef: PropDef<TModel, any>): string
{
    if (propDef.dt === "s")
    {
        if (!propDef.maxlen)
            return "varchar";
        else if (propDef.maxlen > 8000)
            return `text(${propDef.maxlen})`;
        else
            return `varchar(${propDef.maxlen})`;
    }

    return "varchar";
}



