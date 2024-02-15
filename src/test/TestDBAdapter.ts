import { IDBAdapter } from "neshek";

/**
 * Represents an adapter that known to work with a database implementation. Neshek Repository
 * object calls methods of this interface to read from and write to the database.
 */
export class TestDBAdapter implements IDBAdapter
{
    private objects = new Map<string, Map<string, Record<string,any>> | undefined>();

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



