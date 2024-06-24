import { IntegerDataType, ScalarLangType } from "./ModelTypes";
import {
    AClassDef, APropDef, ASchemaDef, ALinkPropDef, StringPropDef, BoolPropDef, IntPropDef
} from "./SchemaTypes";
import { AObject, IDBAdapter } from "./DBTypes";
import {
    ARdbSchemaHints, ARdbClassHints, ARdbLinkPropHints, RdbScalarPropHints, RdbClass, RdbLinkField,
    RdbProp, RdbSchema
} from "./RdbTypes";
import { RepoError } from "./RepoAPI";
import { AQuery } from "./QueryTypes";
import { RepoQueryResponse } from "./RepoTypes";




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
            case "i1":
            case "i2":
            case "i4":
            case "i8":
            case "u1":
            case "u2":
            case "u4":
            case "u8":
                return this.getIntFieldType(propDef);
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
    protected getIntFieldType<T extends IntegerDataType>(propDef: IntPropDef): string
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
     * @param className Name of class in the model.
     * @param key Object with primary key property values.
     * @param propSet Array of property names to retrieve.
     */
    async get(className: string, key: AObject, propNames: string[]): Promise<AObject | null>
    {
        // get the class object
        let cls = getClassFromSchema(this.rdbSchema, className);

        // convert the key object containing property names to one containing field names
        let keyFieldValues = convertValuesPropsToFields(cls, key);

        // convert array of property names to map of property names to fields names
        let fieldNames = convertNamesPropsToFields(cls, propNames);

        // bring values of the fields in the class's table
        let fieldValues = await this.getObject(cls.table, keyFieldValues, fieldNames);
        if (!fieldValues)
            return null;

        // convert object containing field names to one containing property names
        return convertValuesFieldsToProps(cls, propNames, fieldValues);
    }

    /**
     * Retrieves multiple objects by the given criteria.
     * @param className Name of class in the model.
     * @param query Criteria for retrieving objects.
     */
    async query(className: string, query?: AQuery): Promise<RepoQueryResponse<AObject>>
    {
        return {elms: []}
    }

    /**
     * Inserts a new object of the given class with the given field values.
     * @param className Name of class in the model.
     * @param propValues Values of properties to write to the object.
     */
    async insert(className: string, propValues: AObject): Promise<void>
    {
        // get the class object
        let cls = getClassFromSchema(this.rdbSchema, className);

        // get the key properties from the file definition and convert them to field names
        let keyPropNames = cls.classDef.key!;
        let keyFieldNames = convertNamesPropsToFields(cls, keyPropNames);

        // convert the object containing property names to one containing field names
        let fieldValues = convertValuesPropsToFields(cls, propValues);

        await this.insertObject(cls.table, fieldValues, keyFieldNames);
    }

    /**
     * Retrieves the requested fields of the object from the given table identified by the given key.
     * @param tableName Name of the table storing objects.
     * @param keyFieldValues Primary key field values.
     * @param fieldNames Names of the fields to retrieve.
     */
    protected abstract getObject(tableName: string, keyFieldValues: Record<string,ScalarLangType>,
        fieldNames: string[]): Promise<AObject | null>;



    /**
     * Inserts a new object with the given field values to the given table.
     * @param tableName Name of the table storing objects.
     * @param propValues Values of fields to write to the object.
     * @param keyFieldNames Array of field names constituting the object key.
     */
    protected abstract insertObject(tableName: string, fieldValues: AObject,
        keyFieldNames: string[]): Promise<void>;
}




/**
 * For the given class, converts every property name in the array to the corresponding field
 * name(s) and returns a map of the property names to field names. Since for some properties
 * (links), one property can be represented by multiple fields, the values in the map might be
 * arrays of field names rather than a single field name.
 */
function convertNamesPropsToFields(cls: RdbClass, propNames: string[]): string[]
{
    let fieldNames: string[] = [];
    for (let propName of propNames)
    {
        // get the field description; if undefined, it's a multi-link and we just skip it.
        let fieldOrFields = getPropFromClass(cls, propName)?.field;
        if (!fieldOrFields)
            continue;

        if (typeof fieldOrFields === "string")
            fieldNames.push(fieldOrFields);
        else
            fieldNames.push(...Object.keys(fieldOrFields));
    }

    return fieldNames;
}

/**
 * Converts an object with entity properties and their values to an object mapping field names
 * to the values.
 */
function convertValuesPropsToFields(cls: RdbClass, propValues: AObject): AObject
{
    let fieldValues: Record<string,ScalarLangType> = {}
    for (let propName in propValues)
    {
        // get the field description; if undefined, it's a multi-link and we just skip it.
        let fieldOrFields = getPropFromClass(cls, propName)?.field;
        if (!fieldOrFields)
            continue;

        if (typeof fieldOrFields === "string")
            fieldValues[fieldOrFields] = propValues[propName];
        else
        {
            for (let fieldName in fieldOrFields)
            {
                // follow the chain of property names defined for the field to get to the value
                // in the propValues object.
                let propChain = fieldOrFields[fieldName].propChain;
                let nextPart = propValues;
                let i = propChain.length - 1;
                for (let propInChain of propChain)
                {
                    if (propInChain in nextPart)
                    {
                        if (i > 0)
                        {
                            nextPart = nextPart[propInChain];
                            i--;
                        }
                        else
                            fieldValues[fieldName] = nextPart[propInChain];
                    }
                    else
                        throw new Error("Invalid property path");
                }
            }
        }
    }

    return fieldValues;
}

/**
 * Converts an object with entity properties and their values to an object mapping field names
 * to the values.
 */
function convertValuesFieldsToProps(cls: RdbClass, propNames: string[],
    fieldValues: AObject): AObject
{
    let propValues: AObject = {};
    for (let propName of propNames)
    {
        // get the field description; if undefined, it's a multi-link and we just skip it.
        let fieldOrFields = getPropFromClass(cls, propName)?.field;
        if (!fieldOrFields)
            continue;

        if (typeof fieldOrFields === "string")
            propValues[propName] = fieldValues[fieldOrFields];
        else
        {
            for (let fieldName in fieldOrFields)
            {
                // follow chain of property names defined for the field to build the proper
                // chain of objects until the field value for the last property in the chain.
                // `nextProp` will point to the current object in the hierarchy as we go down the
                // chain. When `i` equals zero, that means we reached the last property in the
                // chain.
                let propChain = fieldOrFields[fieldName].propChain;
                let nextProp = propValues;
                let i = propChain.length - 1;
                for (let propInChain of propChain)
                {
                    // if we are not at the last property in the chain, we need to move down the
                    // hierarchy, creating new objects if necessary
                    if (i-- > 0)
                        nextProp = propInChain in nextProp ? nextProp[propInChain] : nextProp[propInChain] = {};
                    else
                        nextProp[propInChain] = fieldValues[fieldName];
                }
            }
        }
    }

    return propValues;
}


/**
 * Returns RdbClass object for the given class from the given schema. If such class doesn't
 * exist in the scheam, throws an exception.
 */
function getClassFromSchema(schema: RdbSchema, className: string): RdbClass
{
    // get the class object
    let cls = schema[className];
    if (!cls)
        RepoError.ClassNotFound(className);
    else
        return cls;
}

/**
 * Returns RdbProp object for the given property from the given class. If such property doesn't
 * exist in the class, throws an exception.
 */
function getPropFromClass(cls: RdbClass, propName: string): RdbProp
{
    let prop = cls.props[propName];
    if (!prop)
        RepoError.PropNotFound(cls.name, propName);
    else
        return prop;
}



/**
 * Provides static functions creating RDB-specific errors.
 */
export abstract class RdbError
{
    static ObjectAlreadyExists(tableName: string, key: any): never
        { throw new RepoError( "OBJECT_ALREADY_EXISTS", {tableName, key}); }
}



