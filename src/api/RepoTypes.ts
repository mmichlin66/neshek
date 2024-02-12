import { Model, KeyOfClass, ModelClassName, ModelClass } from "./ModelTypes"
import { PropSet, Query } from "./QueryTypes";



export interface IDBAdapter
{
    /**
     * Flag indicating whether the underlying DB supports foreign keys and enforces their
     * consistency.
     */
    readonly supportsReferentialIntegrity?: boolean;
}



/** Represents an error that can be produced by repository functions. */
export type RepoError = {
    /** Error code - even if it is numerical it should be represented as string */
    code?: string;

    /** Error message */
    message?: string;

    /** Error stack trace */
    trace?: string;

    /** Downstream error that caused this error */
    causedBy?: RepoError;
}

/**
 * Represents a generic response type returned by repository functions.
 * @typeParam TData type of returned data.
 */
export type RepoResponse<TData> = {
    /**
     * Flag indicating whether the operation was successful. If true, the `data` property will
     * be present (although it can be null). If false, the `error` property will be present.
     */
    success: boolean;

    /** Response data - only present if the `success` property is true. */
    data?: TData;

    /** Operation error - only present if the `success` property is false. */
    error?: RepoError;
}

/** Represent response from the repository `get` operation. */
export type RepoGetResponse<TClass> = RepoResponse<TClass | null>

/** Represent response from the repository `query` operation. */
export type RepoQueryResponse<TClass> = RepoResponse<{
    elms: TClass[];
    cursor?: string;
}>



/**
 * Represents operations that can be performed by a repository.
 */
export interface IRepository<TModel extends Model>
{
    /**
     * Retrieves a single object by the given key
     * @param className
     * @param key
     * @param props
     */
    get<TName extends ModelClassName<TModel>>(
        className: TName,
        key: KeyOfClass<ModelClass<TModel,TName>>,
        props?: PropSet<ModelClass<TModel,TName>, false>
    ): Promise<RepoGetResponse<ModelClass<TModel,TName>>>;

    /**
     * Retrieves multiple objects by the given criteria.
     * @param className
     * @param query
     */
    query<TName extends ModelClassName<TModel>>(
        className: TName,
        query?: Query<ModelClass<TModel,TName>>
    ): Promise<RepoQueryResponse<ModelClass<TModel,TName>>>;
}