import { ClassDef, DataType } from "./SchemaTypes";

/**
 * Represents an adapter that known to work with a database implementation. Neshek Repository
 * object calls methods of this interface to read from and write to the database.
 */
export interface IDBAdapter
{
    /**
     * Flag indicating whether the underlying DB supports foreign keys and enforces their
     * consistency.
     */
    readonly supportsReferentialIntegrity?: boolean;

    // createTable(name: string, classDef: ClassDef<any>): void;
}



