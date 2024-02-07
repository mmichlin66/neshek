import { ArrayPropDef, ClassDef, PropDef, Model, StructDef, StructPropDef, StructType } from "./SchemaTypes"

export function array<S extends Model, T>(elm: PropDef<S,T>): ArrayPropDef<S,T>
{
    return { dt: "arr", elm}
}

export function struct<S extends Model, T extends StructType>(props: StructDef<S,T>): StructPropDef<S,T>
{
    return { dt: "struct", props}
}



export function defineClass<S extends Model, T extends {}>(def: ClassDef<S,T>): void
{
}



