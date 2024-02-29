import { RepoQueryResponse } from "./RepoTypes";



/**
 * Convenience type representing an object with string keys and `any' value types.
 */
export type AObject = Record<string,any>;



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
     * @param className Name of class in the model.
     * @param key Object with primary key property values.
     * @param props Array of property names to retrieve.
     */
    get(className: string, key: AObject, propNames: string[]): Promise<AObject | null>;

    // /**
    //  * Retrieves multiple objects by the given criteria.
    //  * @param className Name of class in the model.
    //  * @param query Criteria for retrieving objects.
    //  */
    // query(className: string, query?: AQuery): Promise<RepoQueryResponse<AObject>>;

    /**
     * Creates new object of the given class with the given properties. The properties must
     * include the primary key (if defined for the class).
     * @param className Name of class in the model.
     * @param propValues Object containing property values.
     */
    insert(className: string, propValues: AObject): Promise<void>;

}



