import { Model } from "./ModelTypes";
import { IDBAdapter, IRepository } from "./RepoTypes";
import { SchemaDef } from "./SchemaTypes"



export function createRepo<TModel extends Model>(schema: SchemaDef<TModel>,
    db: IDBAdapter): IRepository<TModel>
{
    // TODO: implement
    return {} as IRepository<TModel>;
}



