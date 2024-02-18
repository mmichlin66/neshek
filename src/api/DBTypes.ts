/**
 * Represents an adapter that knows to work with a database implementation. Neshek Repository
 * object calls methods of this interface to read from and write to the database.
 */
export interface IDBAdapter
{
    /**
     * Flag indicating whether the underlying DB supports foreign keys and enforces their
     * consistency.
     */
    readonly supportsReferentialIntegrity?: boolean;

    /**
     * Retrieves an instance of the given class using the given primary key or unique constraint
     * and return values of the given set of properties.
     * @param className
     * @param key
     * @param props
     */
    get(className: string, key: any, props: string[]): any;
}

let db = {} as IDBAdapter
let obj = db.get("Product", {code: "123"}, ["code", "name", "msrp"]);
let code = obj.code;



