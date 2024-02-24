import { RdbAdapter, RdbClass, ScalarType } from "../index"



export class SampleRdbAdapter extends RdbAdapter
{
    // Map from class names to a map from flattenned object keys to objects
    private objects = new Map<string, Map<string, Record<string,any>> | undefined>();



    /**
     * Flag indicating whether the underlying DB supports foreign keys and enforces their
     * consistency.
     */
    public get supportsReferentialIntegrity(): boolean {return false; }


    /**
     * Retrieves the requested fields of the object from the given table identified by the given key.
     */
    protected getObject(tableName: string, keyFieldValues: Record<string,ScalarType>,
        fieldNames: string[]): Record<string,any> | null
    {
        let map = this.objects.get(tableName);
        if (!map)
            return null;

        let flattenedKey = flattenFields(keyFieldValues);
        let obj = map.get(flattenedKey);
        if (!obj)
            return null;

        let objToReturn: Record<string,ScalarType> = {};
        for (let field of fieldNames)
            objToReturn[field] = obj[field];

        return objToReturn;
    }



    /**
     * Inserts a new object with the given values to the given table
     */
    protected insertObject(tableName: string, fieldValues: Record<string,ScalarType>,
        keyFieldNames: string[]): void
    {
        let map = this.objects.get(tableName);
        if (!map)
        {
            map = new Map<string, Record<string,any>>();
            this.objects.set(tableName, map);
        }

        // create key object
        let keyFieldValues: Record<string,any> = {};
        for (let keyFieldName of keyFieldNames)
            keyFieldValues[keyFieldName] = fieldValues[keyFieldName];

        let flattenedKey = flattenFields(keyFieldValues);
        let obj = map.get(flattenedKey);
        if (obj)
            throw new Error("Object already exists");

        obj = {}
        for (let fieldName in fieldValues)
            obj[fieldName] = fieldValues[fieldName];

        map.set(flattenedKey, obj);
    }
}



    /** Stringfies the object by first sorting its keys */
    function flattenFields(fieldObj: Record<string,ScalarType>): string
    {
        let fieldNames = Object.keys(fieldObj);
        if (fieldNames.length === 0)
            return "";
        else if (fieldNames.length === 1)
            return JSON.stringify(fieldObj);
        else
        {
            let sortedFieldNames = fieldNames.sort();
            let sortedFieldObj: typeof fieldObj = {};
            for (let fieldName of sortedFieldNames)
                sortedFieldObj[fieldName] = fieldObj[fieldName];

            return JSON.stringify(sortedFieldObj);
        }
    }



