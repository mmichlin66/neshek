import { ModelClassName, AModel, EntityKey, Entity } from "./ModelTypes"
import { PropSet, Query } from "./QueryTypes";



/** Represents an error that can be produced by repository functions. */
export interface IRepoError extends Error
{
    /** Error code - even if it is numerical it should be represented as string */
    code?: string;
}



/**
 * Represents a generic response type returned by repository functions.
 * @typeParam T Type of returned data.
 */
export type RepoResponse<T> = {
    /**
     * Flag indicating whether the operation was successful. If true, the `data` property will
     * be present (although it can be null). If false, the `error` property will be present.
     */
    success: boolean;

    /** Response data - only present if the `success` property is true. */
    data?: T;

    /** Operation error - only present if the `success` property is false. */
    error?: IRepoError;
}

/** Represent response from the repository `get` operation. */
export type RepoGetResponse<T> = RepoResponse<T | null>

/** Represent response from the repository `query` operation. */
export type RepoQueryResponse<T> = RepoResponse<{
    elms: T[];
    cursor?: string;
}>



/**
 * Represents options that can be provided when opening a new session.
 */
export type RepoSessionOptions =
{
    /**
     * Either an array of strings representing user role names or a single string representing a
     * name of a super-admin user - the user with no restrictions. If `authz` is undefined, it is
     * a "guest" session.
     */
    authz?: string[] | string;
}



/**
 * Represents an adapter that known to work with a database implementation. Neshek Repository
 * object calls methods of this interface to read from and write to the database.
 */
export interface IRepository<M extends AModel>
{
    createSession(options?: RepoSessionOptions): IRepoSession<M>;
}



/**
 * Represents operations that can be performed by a repository.
 */
export interface IRepoSession<M extends AModel>
{
    /**
     * Retrieves an instance of the given class using the given primary key or unique constraint
     * and return values of the given set of properties.
     * @param className Name of class in the schema
     * @param key Object with primary key property values
     * @param propSet PropSet object indicating what properties to retrieve.
     */
    get<CN extends ModelClassName<M>>(className: CN, key: EntityKey<M,CN>,
        propSet?: PropSet<M, Entity<M,CN>, false>): Promise<RepoGetResponse<Entity<M,CN>>>;

    /**
     * Retrieves multiple objects by the given criteria.
     * @param className
     * @param query
     */
    query<CN extends ModelClassName<M>>(className: CN,
        query?: Query<M, Entity<M,CN>>): Promise<RepoQueryResponse<Entity<M,CN>>>;

    /**
     * Inserts a new object of the given class with the given field values.
     * @param className Name of class in the schema
     * @param propValues Values of properties to write to the object.
     */
    insert<CN extends ModelClassName<M>>(className: CN, obj: Entity<AModel,CN>): Promise<void>
}



