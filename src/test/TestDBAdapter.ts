import { ClassDef, IDBAdapter, PropDef, RDBClass, RDBClassHints, RDBProp, RDBSchema, RDBSchemaHints, SchemaDef } from "neshek";

/**
 * Represents an adapter that knows to work with a database implementation. Neshek Repository
 * object calls methods of this interface to read from and write to the database.
 */
export class TestDBAdapter implements IDBAdapter
{
    private rdbSchema: RDBSchema;

    private objects = new Map<string, Map<string, Record<string,any>> | undefined>();



    constructor(schema: SchemaDef<any>, schemaHints?: RDBSchemaHints<any>)
    {
        this.rdbSchema = this.processSchema(schema, schemaHints);
    }



    private processSchema(schema: SchemaDef<any>, schemaHints: RDBSchemaHints<any> | undefined): RDBSchema
    {
        let rdbSchema: RDBSchema = {};
        for (let className in schema.classes)
            rdbSchema[className] = this.createRDBClass(schema, schemaHints, className)

        return rdbSchema;
    }

    private createRDBClass(schema: SchemaDef<any>, schemaHints: RDBSchemaHints<any> | undefined,
        className: string): RDBClass
    {
        let classDef = schema.classes[className];
        let classHints = schemaHints?.classes?.[className];

        let rdbClass: RDBClass = {
            table: classHints?.tableName ?? schemaHints?.tableNameFunc?.(className) ?? className,
            props: {}
        }

        for (let propName in classDef.props)
            rdbClass.props[propName] = this.createRDBProp(schema, schemaHints, className, classDef, classHints, propName)

        return rdbClass;
    }

    private createRDBProp(schema: SchemaDef<any>, schemaHints: RDBSchemaHints<any> | undefined,
        className: string, classDef: ClassDef, classHints: RDBClassHints | undefined, propName: string): RDBProp
    {
        let propDef = classDef[propName] as PropDef;
        let propHints = classHints?.props?.[propName];

        // determine field name and type based on property's data type and property hints.
        let dt = propDef.dt;
        let field: RDBProp["field"];
        let ft: string | undefined;
        if (dt === "link")
        {
            field = {};
        }
        else if (dt !== "multilink")
        {
            // take field name from the property hint or make it the same as the property name
            field = propHints?.name as string ?? propName;

            // determine field type either from the property hint or from the function in the
            // schema hint or from the default function according to the property type
            ft = propHints?.columnType as string ??
                schemaHints?.columnTypeFunc?.(propName, propDef) ??
                this.getDefaultColumnType(propDef);
        }

        let rdbProp: RDBProp = {
            propDef,
            field,
        }

        return rdbProp;
    }

    /**
     * Returns an SQL type name (including length or precision if required) for the given property
     * definition.
     * @param propDef Object describing the property
     * @returns SQL type name
     */
    protected getDefaultColumnType(propDef: PropDef): string
    {
        switch (propDef.dt)
        {
            case "str": return !propDef.maxlen ? "varchar" :
                propDef.maxlen > 8000 ? `text(${propDef.maxlen})` :
                `varchar(${propDef.maxlen})`;
            case "bool": return "tinyint";
            case "int": return "tinyint";
            case "bigint": return "bigint";
            case "real": return "float";
        }

        return "varchar";
    }


    /**
     * Flag indicating whether the underlying DB supports foreign keys and enforces their
     * consistency.
     */
    get supportsReferentialIntegrity(): boolean {return true; }

    /**
     * Retrieves an instance of the given class using the given primary key or unique constraint
     * and return values of the given set of properties.
     * @param className
     * @param key
     * @param props
     */
    get(className: string, key: Record<string,any>, props: string[]): Record<string,any> | null
    {
        let obj = this.objects[className]?.get(JSON.stringify(key));
        if (!obj)
            return null;

        let result: Record<string,any> = {};
        for (let prop of props)
            result[prop] = obj.prop;

        return result;
    }
}

let db = {} as TestDBAdapter
let obj = db.get("Product", {code: "123"}, ["code", "name", "msrp"]);
let code = obj?.code;



