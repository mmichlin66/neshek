import { Model, ModelClass, ModelClassName, ModelClassPropName } from "./ModelTypes";
import { CommonPropDef, PropDef } from "./SchemaTypes";



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
     * @returns Column type
     */
    columnTypeFunc?: (propDef: PropDef<TModel, any>) => string;

    /** Hints for individual classes */
    classes?: { [TClassName in ModelClassName<Model>]: RDBClassHints<TModel, TClassName>}
}

/**
 * Represents information on how the class structure from the model should be applied to a
 * relational data base.
 */
export type RDBClassHints<TModel extends Model, TClassName extends ModelClassName<Model>> =
{
    /**
     * Name of the table to keep class instances. If this property is undefined, the table name
     * will be determined either by calling the function from the {@RDBSchemaHints} definition
     * or, if the latter is undefined too, equal to the class name.
     */
    tableName?: string;

    /** Hints for individual properties */
    props?: { [TPropName in ModelClassPropName<TModel, TClassName>]?:
        RDBPropDef<TModel, TClassName, TPropName> }
}

// PropDef<TModel, ModelClass<TModel, TClassName>[TPropName]>

/**
 * Represents information on how the class structure from the model should be applied to a
 * relational data base.
 */
export type RDBPropDef<TModel extends Model, TClassName extends ModelClassName<Model>,
        TPropName extends ModelClassPropName<TModel, TClassName>> =
{
    /**
     * Name of the table to keep class instances. If this property is undefined, the table name
     * will be determined either by calling the function from the {@RDBSchemaHints} definition
     * or, if the latter is undefined too, equal to the class name.
     */
    tableName?: string;
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



