import { IDBAdapter, IRepository } from "./RepoTypes";
import { Schema, SchemaModel } from "./SchemaTypes"



export function createRepo<TSchema extends Schema>(schema: TSchema,
    db: IDBAdapter): IRepository<SchemaModel<TSchema>>
{
    // TODO: implement
    return {} as IRepository<SchemaModel<TSchema>>;
}



