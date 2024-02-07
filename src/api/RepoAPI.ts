import { IDBAdapter, IRepository } from "./RepoTypes";
import { Schema } from "./SchemaTypes"



export function createRepo<TSchema extends Schema>(schema: TSchema, db: IDBAdapter): IRepository<TSchema>
{
    // TODO: implement
    return {} as IRepository<TSchema>;
}



