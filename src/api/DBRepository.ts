import { AModel, Entity, EntityKey, ModelClassName } from "./ModelTypes"
import { AClassDef, ASchemaDef, SchemaDef } from "./SchemaTypes";
import { APropSet, AQuery, PropSet} from "./QueryTypes";
import { IRepoSession, IRepository, RepoGetResponse, RepoQueryResponse, RepoSessionOptions, IRepoError } from "./RepoTypes";
import { IDBAdapter } from "./DBTypes";
import { RepoError } from "./RepoAPI";



/**
 * Represents an adapter that known to work with a database implementation. Neshek Repository
 * object calls methods of this interface to read from and write to the database.
 */
export class DBRepository<M extends AModel> implements IRepository<M>
{
    private schema: SchemaDef<M>;
    private dbAdapter: IDBAdapter;

    constructor(schema: SchemaDef<M>, dbAdapter: IDBAdapter)
    {
        this.schema = schema;
        this.dbAdapter = dbAdapter;
    }

    createSession(options?: RepoSessionOptions): IRepoSession<M>
    {
        return new DBRepoSession(this.schema, this.dbAdapter, options);
    }
}



/**
 * Represents operations that can be performed by a repository.
 */
export class DBRepoSession<M extends AModel> implements IRepoSession<M>
{
    private schema: SchemaDef<M>;
    private dbAdapter: IDBAdapter;
    private options?: RepoSessionOptions;

    constructor(schema: SchemaDef<M>, dbAdapter: IDBAdapter, options?: RepoSessionOptions)
    {
        this.schema = schema;
        this.dbAdapter = dbAdapter;
        this.options = options;
    }

    /**
     * Retrieves an instance of the given class using the given primary key or unique constraint
     * and return values of the given set of properties.
     * @param className Name of class in the schema
     * @param key Object with primary key property values
     * @param propSet PropSet object indicating what properties to retrieve.
     */
    async get<CN extends ModelClassName<M>>(className: CN, key: EntityKey<M,CN>,
        propSet?: PropSet<M, Entity<M,CN>, false>): Promise<RepoGetResponse<Entity<M,CN>>>
    {
        // check whether the class name is valid
        let classDef = this.schema.classes[className];
        if (!classDef)
            RepoError.ClassNotFound(className);

        // if PropSet is undefined, create default PropSet for the given class
        let actPropSet: APropSet = propSet ?? generateDefaultPropSet(classDef);

        try
        {
            let data = await this.dbAdapter.get(className, key, actPropSet);
            return {success: true, data: data as Entity<M,CN>};
        }
        catch (x)
        {
            RepoError.rethrow(x, "Adapter.get");
        }
    }

    /**
     * Retrieves multiple objects by the given criteria.
     * @param className
     * @param query
     */
    async query(className: string, query?: AQuery): Promise<RepoQueryResponse<any>>
    {
        return {success: true, data: {elms: []}};
    }

    /**
     * Inserts a new object of the given class with the given field values.
     * @param className Name of class in the schema
     * @param propValues Values of properties to write to the object.
     */
    async insert(className: string, propValues: Record<string,any>): Promise<void>
    {
    }
}



/**
 * Generates a PropSet that contains names of the scalar and single link properties of the given
 * class.
 */
function generateDefaultPropSet(classDef: AClassDef): APropSet
{
    // include all class properties except multi-links and those explicitly excluded in the
    // schema
    let propNames: string[] = [];
    for (let propName in classDef.props)
    {
        let prop = classDef.props[propName];
        if (prop.dt != "multilink")
            propNames.push(propName);
    }

    return propNames;
}