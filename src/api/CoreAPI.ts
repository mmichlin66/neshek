import { ArrayPropDef, ClassDef, PropDef, SchemaTypes, StructDef, StructPropDef, StructType } from "./CoreTypes"

export function array<S extends SchemaTypes, T>(elm: PropDef<S,T>): ArrayPropDef<S,T>
{
    return { dt: "arr", elm}
}

export function struct<S extends SchemaTypes, T extends StructType>(props: StructDef<S,T>): StructPropDef<S,T>
{
    return { dt: "struct", props}
}



export function defineClass<S extends SchemaTypes, T extends {}>(def: ClassDef<S,T>): void
{
}



