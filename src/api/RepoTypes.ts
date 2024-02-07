import { ModelClass, ModelClassName, Schema, SchemaModel } from "./SchemaTypes"



export interface IDBAdapter
{
    /**
     * Flag indicating whether the underlying DB supports foreign keys and enforces their
     * consistency.
     */
    readonly supportsReferentialIntegrity: boolean;
}



export interface IRepository<TSchema extends Schema>
{
    // /**
    //  * Retrieves a single object by the given key
    //  * @param cls 
    //  * @param key 
    //  */
    get<TName extends ModelClassName<SchemaModel<TSchema>>>(
        cls: TName,
        key: number
        // key: SchemaClassKey<ModelClass<SchemaModel<T>, TName>>
    ): ModelClass<SchemaModel<TSchema>, TName> | null;
    // get<C extends SchemaClassName<T>>(cls: C, key: SchemaClassKey<SchemaClass<T,C>>): SchemaClass<T,C> | null;
}