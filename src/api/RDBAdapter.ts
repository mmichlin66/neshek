import {
    BoolPropDef,
    ClassDef, IDBAdapter, IntPropDef, LinkPropDef, Model, PropDef, RDBClass, RDBClassHints, RDBLinkField,
    RDBLinkFields, RDBProp, RDBSchema, RDBSchemaHints, SchemaDef, StringPropDef
} from "neshek";



/**
 * Represents an adapter that knows to work with a database implementation. Neshek Repository
 * object calls methods of this interface to read from and write to the database.
 */
export class RDBAdapter<TModel extends Model> implements IDBAdapter
{
    private rdbSchema: RDBSchema;

    private objects = new Map<string, Map<string, Record<string,any>> | undefined>();



    constructor(schema: SchemaDef<TModel>, schemaHints?: RDBSchemaHints<TModel>)
    {
        this.rdbSchema = this.processSchema(schema, schemaHints);
    }



    /** Processes schema definition and optional hints and creates RDBSchema object */
    private processSchema(schema: SchemaDef<Model>, schemaHints: RDBSchemaHints<TModel> | undefined): RDBSchema
    {
        let rdbSchema: RDBSchema = {};

        // perform first pass over classes and process their regular properties
        for (let className in schema.classes)
            rdbSchema[className] = this.createRDBClass(schema, schemaHints, className)

        // perform second pass over classes and process their link properties
        for (let className in rdbSchema)
        {
            let rdbClass = rdbSchema[className];
            let classHints = schemaHints?.classes?.[className];
            for (let propName in rdbClass.props)
            {
                let rdbProp = rdbClass.props[propName];
                let propDef = rdbProp.propDef;
                if (propDef.dt === "link")
                    this.processLinkProp(rdbSchema, schemaHints, rdbClass, classHints, rdbProp);
            }
        }
        return rdbSchema;
    }

    /** Creates RDBClass object and its properties except for the link properties */
    private createRDBClass(schema: SchemaDef, schemaHints: RDBSchemaHints | undefined,
        className: string): RDBClass
    {
        let classDef = schema.classes[className];
        let classHints = schemaHints?.classes?.[className];

        let rdbClass: RDBClass = {
            name: className,
            classDef,
            table: classHints?.tableName ?? schemaHints?.tableNameFunc?.(className) ?? className,
            props: {}
        }

        for (let propName in classDef.props)
            rdbClass.props[propName] = this.createRDBProp(schema, schemaHints, classDef, classHints, propName);

        return rdbClass;
    }

    private createRDBProp(schema: SchemaDef, schemaHints: RDBSchemaHints | undefined,
        classDef: ClassDef, classHints: RDBClassHints | undefined, propName: string): RDBProp
    {
        let propDef = classDef.props[propName] as PropDef;
        let propHints = classHints?.props?.[propName];

        // determine field name and type based on property's data type and property hints.
        let field: RDBProp["field"];
        let ft: string | undefined;
        if (propDef.dt === "link")
        {
            field = {};

            // for each property comprizing the primary key of the target class, get chain of
            // properties starting from the target class and until a scalar property.
        }
        else if (propDef.dt !== "multilink")
        {
            // take field name from the property hint or make it the same as the property name
            field = propHints?.name as string ?? propName;

            // determine field type either from the property hint or from the function in the
            // schema hint or from the default function according to the property type
            ft = propHints?.columnType as string ??
                schemaHints?.columnTypeFunc?.(propDef) ??
                this.getColumnType(propDef);
        }

        return {name: propName, propDef, field, ft}
    }

    /** Part of the second pass over schema where we create links to other classes */
    private processLinkProp(rdbSchema: RDBSchema, schemaHints: RDBSchemaHints<any> | undefined,
        rdbClass: RDBClass, classHints: RDBClassHints | undefined,
        rdbProp: RDBProp): void
    {
        let rdbLinkFields = {};
        let initialChain: string[] = [rdbProp.name];
        this.fillRdbLinkFields(rdbLinkFields, initialChain, rdbSchema, schemaHints,
            rdbClass, classHints, rdbProp);
        rdbProp.field = rdbLinkFields;
    }

    /**
     * Fills the RDBLinkField object in the given link property. This is a recursive
     * function, which traverses the "tree" representing the key of the linked object pointed
     * to by the given property.
     */
    private fillRdbLinkFields(rdbLinkFields: RDBLinkFields, leadingChain: string[],
        rdbSchema: RDBSchema, schemaHints: RDBSchemaHints<any> | undefined,
        rdbClass: RDBClass, classHints: RDBClassHints | undefined,
        rdbProp: RDBProp): void
    {
        // get the key of the target class
        let targetClassName = (rdbProp.propDef as LinkPropDef).target;
        let targetRdbClass = rdbSchema[targetClassName];
        let targetClassDef = targetRdbClass.classDef;
        let targetKey = targetClassDef.key;

        // we cannot have links to classes without primary key
        if (!targetKey)
            return;

        // loop over properties comprising the primary key of the target class.
        for (let keyPropName of targetKey)
        {
            let newChain = leadingChain.slice();
            newChain.push(keyPropName);

            // get property definition and check the data type
            let keyPropDef = targetClassDef.props[keyPropName];
            let keyRdbProp = targetRdbClass.props[keyPropName];
            let keyPropHints = classHints?.props?.[keyPropName];
            if (keyPropDef.dt !== "link")
            {
                // field name is either taken from the property hints or is created by
                // joining all fields in the chain with underscore
                let fieldName = keyPropHints?.columnType as string ?? newChain.join("_");
                let rdbLinkField: RDBLinkField = {propChain: newChain, ft: keyRdbProp.ft!};
                rdbLinkFields[fieldName] = rdbLinkField;
            }
            else
            {
                let targetClassHints =  schemaHints?.classes?.[targetClassName];
                this.fillRdbLinkFields(rdbLinkFields, newChain, rdbSchema, schemaHints,
                    targetRdbClass, targetClassHints, keyRdbProp);
            }
        }
    }

    /**
     * Returns an SQL type name (including length or precision if required) for the given property
     * definition.
     * This method can be overridden by the derived classes.
     * @param propDef Object describing the property
     * @returns SQL type name
     */
    protected getColumnType(propDef: PropDef): string
    {
        switch (propDef.dt)
        {
            case "str": return this.getStringColumnType(propDef);
            case "bool": return this.getBoolColumnType(propDef);
            case "int": return this.getIntColumnType(propDef);
            case "bigint": return "bigint";
            case "real": return "float";
        }

        return "varchar";
    }

    /**
     * Returns an SQL type name (including length or precision if required) for the given
     * definition of a string property.
     * This method can be overridden by the derived classes.
     * @param propDef Object describing the string property
     * @returns SQL type name
     */
    protected getStringColumnType(propDef: StringPropDef): string
    {
       return !propDef.maxlen ? "varchar" :
                propDef.maxlen > 8000 ? `text(${propDef.maxlen})` :
                `varchar(${propDef.maxlen})`;
    }

    /**
     * Returns an SQL type name (including length or precision if required) for the given
     * definition of a boolean property.
     * This method can be overridden by the derived classes.
     * @param propDef Object describing the boolean property
     * @returns SQL type name
     */
    protected getBoolColumnType(propDef: BoolPropDef): string
    {
       return "tinyint";
    }

    /**
     * Returns an SQL type name (including length or precision if required) for the given
     * definition of an integer property.
     * This method can be overridden by the derived classes.
     * @param propDef Object describing the integer property
     * @returns SQL type name
     */
    protected getIntColumnType(propDef: IntPropDef): string
    {
       return "int";
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

// let db = {} as RDBAdapter
// let obj = db.get("Product", {code: "123"}, ["code", "name", "msrp"]);
// let code = obj?.code;



