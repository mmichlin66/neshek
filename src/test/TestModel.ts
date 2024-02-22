import {
    ModelClassName, ModelClasses, Model, Class, MultiLink, NameOfClass,
    Struct, Entity, EntityKey, XOR
} from "../index";



export type OrderClass = Class<"Order", {id: number}, undefined> &
{
    time?: Date;
    items?: MultiLink<ItemClass>;
    // note?: NoteStruct;
}

export type ProductClass = Class<"Product", {code: string}, undefined> &
{
    name?: string;
    msrp?: number;
    items?: MultiLink<ItemClass>;
    // notes?: NoteStruct[];
}

export type ItemClass = Class<"Item", {order: OrderClass, product: ProductClass}, undefined> &
{
    price?: number;
    // managerNotes?: {manager: string, note: NoteStruct}
}

export type ExtraItemInfoClass = Class<"ExtraItemInfo", {item: ItemClass}, undefined> &
{
    comments?: string;
}

export type NoteStruct = Struct<"Note"> &
{
    time?: number;
    text?: string;
}

export type MyModel = Model<
    [OrderClass, ProductClass, ItemClass, ExtraItemInfoClass],
    [NoteStruct]
>;



function test(): void
{
    let classes: ModelClasses<MyModel>;
    let classNames: ModelClassName<MyModel> = "Item";
    let order: Entity<MyModel, "Order"> = {id: 123};
    let orderName: NameOfClass<OrderClass> = "Order";
    let orderKey: EntityKey<MyModel, "Order"> = {id: 123};
    let product: Entity<MyModel, "Product"> = {code: "123", msrp: 35.99, name: "desk", };
    let productName: NameOfClass<ProductClass> = "Product";
    let productKey:  EntityKey<MyModel, "Product"> = {code: "123"};
    let item: Entity<MyModel, "Item"> = {order: {id: 123}, product: {code: "123"}, price: 30.99};
    let itemName: NameOfClass<ItemClass> = "Item";
    let itemKey:  EntityKey<MyModel, "Item"> = {order: {id: 123}, product: {code: "123"}};
    let extraItemInfo: Entity<MyModel, "ExtraItemInfo"> =
        {comments: "comments", item: {order: {id: 123}, product: {code: "123"}}};
    let extraItemInfoName: NameOfClass<ExtraItemInfoClass> = "ExtraItemInfo";
    let extraItemInfoKey:  EntityKey<MyModel, "ExtraItemInfo"> = {item: {order: {id: 123}, product: {code: "123"}}};

    // @ts-expect-error (should complain on `msrp` property)
    let itemDeepKey:  EntityKey<MyModel, "Item"> = {order: {id: 123}, product: {code: "123", msrp: 19.95}};

    // @ts-expect-error (should be either code or id)
    let x7pk: XOR<[ EntityKey<MyModel, "Order">,  EntityKey<MyModel, "Product">]> = {code: "123", id: 123};

    // let structs: ModelStructs<MyModel>;
    // let structNames: ModelStructName<MyModel> = "Note";
}



