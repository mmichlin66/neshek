import { ScalarType } from "./ModelTypes";
import {
    AClassDef, APropDef, ASchemaDef, ALinkPropDef, StringPropDef, BoolPropDef, IntPropDef
} from "./SchemaTypes";
import { IDBAdapter } from "./DBTypes";
import {
    ARdbSchemaHints, ARdbClassHints, ARdbLinkPropHints, RdbScalarPropHints, RdbClass, RdbLinkField,
    RdbProp, RdbSchema
} from "./RdbTypes";




/**
 * Represents an adapter that knows to work with a relational database. To support concrete
 * databases, an adapter class should derive from this class.
 */
export abstract class RdbAdapter implements IDBAdapter
{
    // Processed schema
    protected rdbSchema: RdbSchema;



    constructor(schemaDef: ASchemaDef, schemaHints?: ARdbSchemaHints)
    {
        this.rdbSchema = this.processSchema(schemaDef, schemaHints);
    }



    /** Processes schema definition and optional hints and creates RDBSchema object */
    private processSchema(schemaDef: ASchemaDef, schemaHints: ARdbSchemaHints | undefined): RdbSchema
    {
        let rdbSchema: RdbSchema = {};

        // perform first pass over classes and process their regular properties
        for (let className in schemaDef.classes)
            rdbSchema[className] = this.processClass(schemaDef, schemaHints, className)

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
    private processClass(schemaDef: ASchemaDef, schemaHints: ARdbSchemaHints | undefined,
        className: string): RdbClass
    {
        let classDef = schemaDef.classes[className];
        let classHints = schemaHints?.classes?.[className];

        let rdbClass: RdbClass = {
            name: className,
            classDef,
            table: classHints?.tableName ?? schemaHints?.tableNameFunc?.(className) ?? className,
            props: {}
        }

        for (let propName in classDef.props)
            rdbClass.props[propName] = this.processNonLinkProp(schemaDef, schemaHints, classDef,
                classHints, propName);

        return rdbClass;
    }

    /** Processes the given non-link and non-multilink property */
    private processNonLinkProp(schemaDef: ASchemaDef, schemaHints: ARdbSchemaHints | undefined,
        classDef: AClassDef, classHints: ARdbClassHints | undefined, propName: string): RdbProp
    {
        let propDef = classDef.props[propName];
        let propHints = classHints?.props?.[propName];

        // determine field name and type based on property's data type and property hints.
        let field: RdbProp["field"];
        let ft: string | undefined;
        if (propDef.dt !== "multilink" && propDef.dt !== "link")
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
            let keyPropDef = targetClassDef.props[keyPropName];
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
        // get the class object
        let cls = this.rdbSchema[className];
        if (!cls)
            throw new Error("Class not found");

        let keyFields = convertPropToFieldValues(cls, key);

        // convert array of property names to map of property names to fields names
        let fieldNames = mapPropsToFields(cls, props);

        let obj = this.getObject(cls, keyFields, fieldNames);
        if (!obj)
            return null;

        // convert object containing fields to object containing properties
        return convertFieldToPropValues(cls, props, obj);
    }

    protected abstract getObject(cls: RdbClass, keyFields: Record<string,ScalarType>,
        fields: string[]): Record<string,any> | null;



    public insert(className: string, obj: Record<string,any>): void
    {
    }

    protected abstract insertObjectObject(cls: RdbClass, obj: Record<string,ScalarType>): void;
}



/**
 * For the given class, converts every property name in the array to the corresponding field
 * name(s) and returns a map of the property names to field names. Since for some properties
 * (links), one property can be represented by multiple fields, the values in the map might be
 * arrays of field names rather than a single field name.
 */
function mapPropsToFields(cls: RdbClass, propNames: string[]): string[]
{
    let fieldNames: string[] = [];
    for (let propName of propNames)
    {
        let prop = cls.props[propName];
        if (!prop)
            throw new Error("Property not found");
        else if (!prop.field)
            throw new Error("Multilink property cannot be part of a key");

        if (typeof prop.field === "string")
            fieldNames.push(prop.field);
        else
            fieldNames.push(...Object.keys(prop.field));
    }

    return fieldNames;
}

/**
 * Converts an object with entity properties and their values to an object mapping field names
 * to the values.
 */
function convertPropToFieldValues(cls: RdbClass, propValues: Record<string,any>): Record<string,any>
{
    let fieldValues: Record<string,ScalarType> = {}
    for (let propName in propValues)
    {
        let prop = cls.props[propName];
        if (!prop)
            throw new Error("Property not found");
        else if (!prop.field)
            throw new Error("Multilink property cannot be part of a key");

        if (typeof prop.field === "string")
            fieldValues[prop.field] = propValues[propName];
        else
        {
            for (let fieldName in prop.field)
            {
                // follow chain of property names defined for the field to get to the value
                // in the key
                let field = cls.props[propName].field as Record<string, RdbLinkField>;
                let propChain = field[fieldName].propChain;
                let curKeyPart: any = propValues;
                for (let propInChain of propChain)
                {
                    if (propInChain in curKeyPart)
                        curKeyPart = curKeyPart[propInChain]
                    else
                        throw new Error("Invalid part of a key");
                }

                // after the loop, curKeyPart points to the scalar value of the last property
                fieldValues[fieldName] = curKeyPart;
            }
        }
    }

    return fieldValues;
}


/**
 * Converts an object with entity properties and their values to an object mapping field names
 * to the values.
 */
function convertFieldToPropValues(cls: RdbClass, propNames: string[],
    fieldValues: Record<string,any>): Record<string,any>
{
    let result: Record<string,any> = {};
    for (let propName of propNames)
    {
        let prop = cls.props[propName];
        if (!prop)
            throw new Error("Property not found");
        else if (!prop.field)
            throw new Error("Multilink property cannot be part of a key");

        if (typeof prop.field === "string")
            result[prop.field] = fieldValues[prop.field];
        else
        {
            for (let fieldName in prop.field)
            {
                // follow chain of property names defined for the field to get to the value
                // in the key
                let field = cls.props[propName].field as Record<string, RdbLinkField>;
                let propChain = field[fieldName].propChain;
                let curKeyPart: any = result;
                for (let propInChain of propChain)
                {
                    if (propInChain in curKeyPart)
                        curKeyPart = result[propInChain] = {}
                    else
                        throw new Error("Invalid part of a key");
                }

                // after the loop, curKeyPart points to the scalar value of the last property
                curKeyPart = fieldValues[fieldName];
            }
        }
    }

    return fieldValues;
}


