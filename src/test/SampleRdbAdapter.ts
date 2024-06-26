import { AObject, RdbAdapter, RdbError, ScalarLangType } from "../index"



export class SampleRdbAdapter extends RdbAdapter
{
    // Map from class names to a map from flattenned object keys to objects
    private objects = new Map<string, Map<string, AObject> | undefined>();



    /**
     * Flag indicating whether the underlying DB supports foreign keys and enforces their
     * consistency.
     */
    get supportsReferentialIntegrity(): boolean {return false; }


    /**
     * Retrieves the requested fields of the object from the given table identified by the given key.
     */
    protected async getObject(tableName: string, keyFieldValues: Record<string,ScalarLangType>,
        fieldNames: string[]): Promise<AObject | null>
    {
        let map = this.objects.get(tableName);
        if (!map)
            return null;

        let flattenedKey = flattenFields(keyFieldValues);
        let obj = map.get(flattenedKey);
        if (!obj)
            return null;

        let objToReturn: Record<string,ScalarLangType> = {};
        for (let field of fieldNames)
            objToReturn[field] = obj[field];

        return objToReturn;
    }



    /**
     * Inserts a new object with the given values to the given table
     */
    protected async insertObject(tableName: string, fieldValues: Record<string,ScalarLangType>,
        keyFieldNames: string[]): Promise<void>
    {
        // create key object
        let keyFieldValues: AObject = {};
        for (let keyFieldName of keyFieldNames)
            keyFieldValues[keyFieldName] = fieldValues[keyFieldName];

        let flattenedKey = flattenFields(keyFieldValues);

        let map = this.objects.get(tableName);
        if (!map)
        {
            map = new Map<string, AObject>();
            this.objects.set(tableName, map);
        }
        else
        {
            // check whether we already have an object with this key
            let obj = map.get(flattenedKey);
            if (obj)
                RdbError.ObjectAlreadyExists(tableName, flattenedKey);
        }

        // copy field values into a new object
        let obj: Record<string,ScalarLangType> = {}
        for (let fieldName in fieldValues)
            obj[fieldName] = fieldValues[fieldName];

        // add the new object
        map.set(flattenedKey, obj);
    }
}



    /** Stringifies the object by first sorting its keys */
    function flattenFields(fieldObj: Record<string,ScalarLangType>): string
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



