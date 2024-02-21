import {
    AClassDef,
    AModel,
    APropDef,
    ASchemaDef,
    BoolPropDef,
    ClassDef, IDBAdapter, IntPropDef, LinkPropDef, Model, PropDef, RDBClass, RDBClassHints, RDBLinkField,
    RDBLinkFields, RDBLinkPropHints, RDBProp, RDBScalarPropHints, RDBSchema, RDBSchemaHints, SchemaDef, StringPropDef
} from "neshek";



/**
 * Represents an adapter that knows to work with a database implementation. Neshek Repository
 * object calls methods of this interface to read from and write to the database.
 */
export class RDBAdapter implements IDBAdapter
{
    private rdbSchema: RDBSchema;

    private objects = new Map<string, Map<string, Record<string,any>> | undefined>();



    constructor(schema: ASchemaDef, schemaHints?: RDBSchemaHints<any>)
    {
        this.rdbSchema = this.processSchema(schema, schemaHints);
    }



    /** Processes schema definition and optional hints and creates RDBSchema object */
    private processSchema(schema: ASchemaDef, schemaHints: RDBSchemaHints<any> | undefined): RDBSchema
    {
        let rdbSchema: RDBSchema = {};

        // perform first pass over classes and process their regular properties
        for (let className in schema.classes)
            rdbSchema[className] = this.createClass(schema, schemaHints, className)

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
    private createClass(schema: ASchemaDef, schemaHints: RDBSchemaHints<any> | undefined,
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
            rdbClass.props[propName] = this.createProp(schema, schemaHints, classDef, classHints, propName);

        return rdbClass;
    }

    private createProp(schema: ASchemaDef, schemaHints: RDBSchemaHints<any> | undefined,
        classDef: AClassDef, classHints: RDBClassHints<any,any> | undefined, propName: string): RDBProp
    {
        let propDef = classDef.props[propName] as APropDef;
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
            ft = propHints?.ft as string ??
                schemaHints?.fieldTypeFunc?.(propDef) ??
                this.getFieldType(propDef);
        }

        return {name: propName, propDef, field, ft}
    }

    /** Part of the second pass over schema where we create links to other classes */
    private processLinkProp(rdbSchema: RDBSchema, schemaHints: RDBSchemaHints<any> | undefined,
        rdbClass: RDBClass, classHints: RDBClassHints<any,any> | undefined,
        rdbProp: RDBProp): void
    {
        let rdbLinkFields = {};
        let initialChain: string[] = [rdbProp.name];
        this.fillLinkFields(rdbLinkFields, initialChain, rdbSchema, schemaHints,
            rdbProp, classHints?.props?.[rdbProp.name]);
        rdbProp.field = rdbLinkFields;
    }

    /**
     * Fills the RDBLinkField object in the given link property. This is a recursive
     * function, which traverses the "tree" representing the key of the linked object pointed
     * to by the given property.
     */
    private fillLinkFields(rdbLinkFields: RDBLinkFields, leadingChain: string[],
        rdbSchema: RDBSchema, schemaHints: RDBSchemaHints<any> | undefined,
        rdbProp: RDBProp, propHints: RDBLinkPropHints<any> | RDBScalarPropHints | undefined): void
    {
        // get the key of the target class
        let targetClassName = (rdbProp.propDef as LinkPropDef<any,string>).target;
        let targetRdbClass = rdbSchema[targetClassName];
        let targetClassDef = targetRdbClass.classDef;
        let targetKey = targetClassDef.key as string[];

        // we cannot have links to classes without primary key
        if (!targetKey)
            return;

        // loop over properties comprising the primary key of the target class.
        for (let keyPropName of targetKey)
        {
            let newChain = leadingChain.slice();
            newChain.push(keyPropName);

            // get property definition and check the data type
            let keyPropDef = targetClassDef.props[keyPropName] as APropDef;
            let keyRdbProp = targetRdbClass.props[keyPropName];
            let keyPropHints = propHints?.[keyPropName];
            if (keyPropDef.dt !== "link")
            {
                // field name is either taken from the property hints or is created by
                // joining all fields in the chain with underscore
                let fieldName = keyPropHints?.name as string ?? newChain.join("_");
                let ft = keyPropHints?.ft ?? keyRdbProp.ft!
                rdbLinkFields[fieldName] = {propChain: newChain, ft};
            }
            else
            {
                this.fillLinkFields(rdbLinkFields, newChain, rdbSchema, schemaHints,
                    keyRdbProp, keyPropHints);
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
    protected getFieldType(propDef: APropDef): string
    {
        switch (propDef.dt)
        {
            case "str": return this.getStringFieldType(propDef);
            case "bool": return this.getBoolFieldType(propDef);
            case "int": return this.getIntFieldType(propDef);
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
    protected getStringFieldType(propDef: StringPropDef): string
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
    protected getBoolFieldType(propDef: BoolPropDef): string
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
    protected getIntFieldType(propDef: IntPropDef): string
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



