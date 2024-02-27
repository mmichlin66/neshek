import { APropSet } from "./QueryTypes";

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
     * @param className Name of class in the schema
     * @param key Object with primary key property values
     * @param props Array of property names to retrieve.
     */
    get(className: string, key: Record<string,any>, propSet: APropSet): Promise<Record<string,any> | null>;

    insert(className: string, propValues: Record<string,any>): Promise<void>;

}



