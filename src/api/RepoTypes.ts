import { ModelClassName, AModel, EntityKey, Entity } from "./ModelTypes"
import { PropSet, Query } from "./QueryTypes";



/** Represent response from the repository `query` operation. */
export type RepoQueryResponse<T> = {
    /** Array of found elements of the given type */
    elms: T[];

    /**
     * Opaque string that can be used to retrieve more pages of query results.
     */
    cursor?: string;
}



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
     * @param className Name of class in the model.
     * @param key Object with primary key property values.
     * @param propSet PropSet object indicating what properties to retrieve.
     */
    get<CN extends ModelClassName<M>>(className: CN, key: EntityKey<M,CN>,
        propSet?: PropSet<M, Entity<M,CN>, false>): Promise<Entity<M,CN> | null>;

    /**
     * Retrieves multiple objects by the given criteria.
     * @param className Name of class in the model.
     * @param query Criteria for retrieving objects.
     */
    query<CN extends ModelClassName<M>>(className: CN,
        query?: Query<M, Entity<M,CN>>): Promise<RepoQueryResponse<Entity<M,CN>>>;

    /**
     * Inserts a new object of the given class with the given field values.
     * @param className Name of class in the model.
     * @param propValues Values of properties to write to the object.
     */
    insert<CN extends ModelClassName<M>>(className: CN, propValues: Entity<M,CN>): Promise<void>
}



