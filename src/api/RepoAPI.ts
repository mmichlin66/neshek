import { Model } from "./ModelTypes";
import { SchemaDef } from "./SchemaTypes"
import { IDBAdapter } from "./DBTypes";
import { IRepository } from "./RepoTypes";



export function createRepo<TModel extends Model>(schema: SchemaDef<TModel>,
    db: IDBAdapter): IRepository<TModel>
{
    // TODO: implement
    return {} as IRepository<TModel>;
}



