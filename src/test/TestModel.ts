import {
    ModelClassName, ModelClasses, Model, Class, MultiLink, NameOfClass, Struct, Entity, EntityKey,
    XOR, ModelClassProps, ModelClassKey, ModelClassUnique, ArrayPropDef, PropDef, ModelStructs,
    ModelStructName
} from "../index";



export type OrderClass = Class<"Order", {id: "i8"}, undefined> &
{
    time: "datetime";
    items: MultiLink<ItemClass>;
    note: NoteStruct;
}

export type ProductClass = Class<"Product", {code: "str"}, undefined> &
{
    name: "str";
    msrp: "dec";
    items: MultiLink<ItemClass>;
    notes: NoteStruct[];
}

export type ItemClass = Class<"Item", {order: OrderClass, product: ProductClass}, [{abc: "i4"}, {xyz: "str", klm: "bool"}]> &
{
    qty: "i2";
    price: "real";
    managerNote: {manager: "str", note: NoteStruct}
}

export type ExtraItemInfoClass = Class<"ExtraItemInfo", {item: ItemClass}, undefined> &
{
    comments: "str";
}

export type NoteStruct = Struct<"Note"> &
{
    time: "i8";
    text: "str";
}

export type PersonClass = Class<"Person", {fn: "str", ln: "str", dob: "str"}, undefined> &
{
    address: "str";
    phones: "str"[];
}

export type MyModel = Model<
    [OrderClass, ProductClass, ItemClass, ExtraItemInfoClass, PersonClass],
    [NoteStruct]
>;



function test(): void
{
    let itemClassKey: ModelClassKey<MyModel, "Item">;
    let itemClassUnique: ModelClassUnique<MyModel, "Item"> = {abc: "i4", xyz: "str", klm: "bool"};
    let itemClassProps: ModelClassProps<MyModel,"Item"> = {};
    itemClassProps.order;
    itemClassProps.product;
    itemClassProps.price;
    itemClassProps.qty;
    itemClassProps.abc;
    itemClassProps.xyz;
    itemClassProps.klm;

    let classes: ModelClasses<MyModel>;
    let classNames: ModelClassName<MyModel> = "Item";
    let order: Entity<MyModel, "Order"> = {id: 123};
    let orderName: NameOfClass<OrderClass> = "Order";
    let orderKey: EntityKey<MyModel, "Order"> = {id: 123};
    let product: Entity<MyModel, "Product"> = {code: "123", msrp: 35.99, name: "desk", items: {elms: [], cursor: undefined} };
    let productName: NameOfClass<ProductClass> = "Product";
    let productKey:  EntityKey<MyModel, "Product"> = {code: "123"};
    let item: Entity<MyModel, "Item"> = {order: {id: 123}, product: {code: "123"}, price: 30.99, abc: 1, xyz: "", klm: true};
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

    let structs: ModelStructs<MyModel>;
    let structNames: ModelStructName<MyModel> = "Note";

    let arr: ArrayPropDef<MyModel, "str"> = {dt: "arr", elm: {dt: "str"}}
    let arr1: PropDef<MyModel, "str"[]> = {dt: "arr", elm: {dt: "str"}}
}



