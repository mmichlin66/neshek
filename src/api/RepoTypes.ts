import { Model, KeyOfModelClass, ModelClassName, ModelClass } from "./ModelTypes"
import { PropSet } from "./QueryTypes";



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
    /** Numerical error code */
    code?: number;

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
    get<TName extends ModelClassName<TModel>, TClass = ModelClass<TModel,TName>>(
        className: TName,
        key: KeyOfModelClass<TClass>,
        props?: PropSet<TClass>
    ): Promise<RepoGetResponse<TName>>;
}