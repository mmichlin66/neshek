import { AClassDef, APropDef, ASchemaDef, ALinkPropDef, StringPropDef, BoolPropDef, IntPropDef } from "./SchemaTypes";
import { IDBAdapter } from "./DBTypes";
import { ARdbSchemaHints, ARdbClassHints, ARdbLinkPropHints, RdbScalarPropHints } from "./RdbTypes";




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
     * Database-specific type of the field corresponding to the property. This can be undefined
     * if the property is a link, which consists of more than one field, or if it is a multi-link.
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



/**
 * Represents an adapter that knows to work with a database implementation. Neshek Repository
 * object calls methods of this interface to read from and write to the database.
 */
export class RdbAdapter implements IDBAdapter
{
    private rdbSchema: RdbSchema;

    private objects = new Map<string, Map<string, Record<string,any>> | undefined>();



    constructor(schema: ASchemaDef, schemaHints?: ARdbSchemaHints)
    {
        this.rdbSchema = this.processSchema(schema, schemaHints);
    }



    /** Processes schema definition and optional hints and creates RDBSchema object */
    private processSchema(schema: ASchemaDef, schemaHints: ARdbSchemaHints | undefined): RdbSchema
    {
        let rdbSchema: RdbSchema = {};

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
    private createClass(schema: ASchemaDef, schemaHints: ARdbSchemaHints | undefined,
        className: string): RdbClass
    {
        let classDef = schema.classes[className];
        let classHints = schemaHints?.classes?.[className];

        let rdbClass: RdbClass = {
            name: className,
            classDef,
            table: classHints?.tableName ?? schemaHints?.tableNameFunc?.(className) ?? className,
            props: {}
        }

        for (let propName in classDef.props)
            rdbClass.props[propName] = this.createProp(schema, schemaHints, classDef, classHints, propName);

        return rdbClass;
    }

    private createProp(schema: ASchemaDef, schemaHints: ARdbSchemaHints | undefined,
        classDef: AClassDef, classHints: ARdbClassHints | undefined, propName: string): RdbProp
    {
        let propDef = classDef.props[propName] as APropDef;
        let propHints = classHints?.props?.[propName];

        // determine field name and type based on property's data type and property hints.
        let field: RdbProp["field"];
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
    private processLinkProp(rdbSchema: RdbSchema, schemaHints: ARdbSchemaHints | undefined,
        rdbClass: RdbClass, classHints: ARdbClassHints | undefined,
        rdbProp: RdbProp): void
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
    private fillLinkFields(rdbLinkFields: Record<string, RdbLinkField>, leadingChain: string[],
        rdbSchema: RdbSchema, schemaHints: ARdbSchemaHints | undefined,
        rdbProp: RdbProp, propHints: ARdbLinkPropHints | RdbScalarPropHints | undefined): void
    {
        // get the key of the target class
        let targetClassName = (rdbProp.propDef as ALinkPropDef).target;
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
    public get supportsReferentialIntegrity(): boolean {return true; }

    /**
     * Retrieves an instance of the given class using the given primary key or unique constraint
     * and return values of the given set of properties.
     * @param className
     * @param key
     * @param props
     */
    public get(className: string, key: Record<string,any>, props: string[]): Record<string,any> | null
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



