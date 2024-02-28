import { AModel, Entity, EntityKey, ModelClassName } from "./ModelTypes"
import { AClassDef, SchemaDef } from "./SchemaTypes";
import { APropSet, AQuery, PropSet} from "./QueryTypes";
import { IRepoSession, IRepository, RepoQueryResponse, RepoSessionOptions } from "./RepoTypes";
import { AObject, IDBAdapter } from "./DBTypes";
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
        propSet?: PropSet<M, Entity<M,CN>, false>): Promise<Entity<M,CN> | null>
    {
        try
        {
            return await this.getR(className, key, propSet) as Entity<M,CN>;
        }
        catch (x)
        {
            RepoError.rethrow(x, {source: "Adapter.get"});
        }
    }

    /**
     * Recursively retrieves an object of the given class with the properties indicated by the
     * given PropSet. Calls itself for linked objects.
     */
    private async getR(className: string, key: AObject, propSet?: APropSet): Promise<AObject | null>
    {
        // check whether the class name is valid
        let classDef = this.schema.classes[className];
        if (!classDef)
            RepoError.ClassNotFound(className);

        // if PropSet is undefined create default PropSet for the given class
        if (!propSet)
            propSet = generateDefaultPropSet(classDef);

        // get the list of top-level properties from the PropSet.
        let propNames = getPropNamesFromPropSet(className, classDef, propSet);

        // retrieve values of the top-level properties. This includes the keys of the linked
        // objects
        let obj = await this.dbAdapter.get(className, key, propNames);
        if (!obj)
            return null;

        // for a hierarchical PropSet, go over its top-level properties and check whether we have
        // single links. By now we have keys for every single link. Check whether we have nested
        // PropSet for these links.
        if (typeof propSet === "object")
        {
            for (let propName in obj)
            {
                let propDef = classDef.props[propName];
                if (propDef.dt === "link")
                {
                    let nestedPropSet = propSet[propName];
                    if (nestedPropSet)
                    {
                        // `obj[propName] is the key of the nested object
                        let nestedObj = await this.getR(propDef.target, obj[propName], nestedPropSet);
                        if (nestedObj)
                            obj[propName] = nestedObj;
                    }
                }
            }
        }

        return obj;
}



    /**
     * Retrieves multiple objects by the given criteria.
     * @param className
     * @param query
     */
    async query(className: string, query?: AQuery): Promise<RepoQueryResponse<any>>
    {
        return {elms: []};
    }



    /**
     * Inserts a new object of the given class with the given field values.
     * @param className Name of class in the schema
     * @param propValues Values of properties to write to the object.
     */
    async insert<CN extends ModelClassName<M>>(className: CN, propValues: Entity<M,CN>): Promise<void>
    {
        // check whether the class name is valid
        let classDef = this.schema.classes[className];
        if (!classDef)
            RepoError.ClassNotFound(className);

        try
        {
            await this.dbAdapter.insert(className, propValues);
        }
        catch (x)
        {
            RepoError.rethrow(x, {source: "Adapter.insert"});
        }
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

/**
 * Returns a flat array of property names from the given PropSet. If this is already an array of
 * names, return it as is; otherwise (if it is an object form of the PropSet), return an array of
 * its keys. If it is a string, then it should be comma-and-space-separated list of property names.
 */
function getPropNamesFromPropSet(className: string, classDef: AClassDef, propSet: APropSet): string[]
{
    if (typeof propSet === "string")
    {
        // split the string into property names and check that the names are valid
        let propNames = propSet.split(/[\s,;]+/);
        let result: string[] = [];
        for (let propName of propNames)
        {
            let propDef = classDef.props[propName];
            if (!propDef)
                RepoError.PropNotFound(className, propName);
            else if (propDef.dt !== "multilink")
                result.push(propName);
        }

        return result;
    }
    else
        return Array.isArray(propSet) ? propSet : Object.keys(propSet);
}



