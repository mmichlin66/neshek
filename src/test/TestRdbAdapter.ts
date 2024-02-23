import { RdbAdapter, RdbClass, ScalarType } from "../index"



export class TestRdbAdapter extends RdbAdapter
{
    // Map from class names to a map from flattenned object keys to objects
    private objects = new Map<string, Map<string, Record<string,any>> | undefined>();



    /**
     * Flag indicating whether the underlying DB supports foreign keys and enforces their
     * consistency.
     */
    public get supportsReferentialIntegrity(): boolean {return false; }


    /**
     * Retrieves the requested fields of the object of the given class identified by the given key.
     */
    protected getObject(cls: RdbClass, keyFields: Record<string,ScalarType>,
        fields: string[]): Record<string,any> | null
    {
        let map = this.objects[cls.name];
        if (!map)
            return null;

        let flattenedKey = flattenFields(keyFields);
        let obj = map[flattenedKey];
        if (!obj)
            return null;

        let objToReturn: Record<string,ScalarType> = {};
        for (let field of fields)
            objToReturn[field] = obj[field];

        return objToReturn;
    }



    protected insertObjectObject(cls: RdbClass, obj: Record<string,ScalarType>): void
    {
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



