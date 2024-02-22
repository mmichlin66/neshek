import { RdbAdapter, RdbClass, ScalarType } from "../index"



export class TestRdbAdapter extends RdbAdapter
{
    private objects = new Map<string, Map<string, Record<string,any>> | undefined>();



    /**
     * Flag indicating whether the underlying DB supports foreign keys and enforces their
     * consistency.
     */
    public get supportsReferentialIntegrity(): boolean {return false; }

    protected getObject(cls: RdbClass, keyFields: Record<string,ScalarType>): Record<string,any> | null
    {
        let map = this.objects[cls.name];
        if (!map)
            return null;

        let flattenedKey = this.flattenFields(keyFields);
        return map[flattenedKey];
    }



    private flattenFields(fields: Record<string,ScalarType>): string
    {
        return "";
    }
}



