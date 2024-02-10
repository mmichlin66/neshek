import { ModelClass, ModelClassName, ModelClasses, Model, NeshekClass, PKofModelClass } from "neshek";

export type Order = NeshekClass<{id: number}> &
{
    items?: Item[];
}

export type Product = NeshekClass<{code: string}> &
{
    name?: string;
    msrp?: number;
    notes?: Note[];
}

export type Note =
{
    time?: number;
    text?: string;
}

export type Item = NeshekClass<{order: Order, product: Product}> &
{
    price?: number;
}

export type ExtraItemInfo = NeshekClass<{item: Item}> &
{
    price?: number;
    comments: string[];
}

export type MyClasses =
{
    Order: Order;
    Product: Product;
    Item: Item;
    ExtraItemInfo: ExtraItemInfo;
}

export type MyStructs =
{
    Note: Note;
}

export type MyModel = Model<MyClasses, MyStructs>;



let x1: ModelClasses<MyModel>;
let x2: ModelClassName<MyModel> = "Item";
let x3: ModelClass<MyModel, "Order"> = {id: 123};
let x3pk: PKofModelClass<Order>;
let x4: ModelClass<MyModel, "Product"> = {code: "123", msrp: 35.99, name: "desk", notes: [{}]};
let x4pk: PKofModelClass<Product>;
let x5: ModelClass<MyModel, "Item">;
let x5pk: PKofModelClass<Item> = {order: {id: 123}, product: {code: "123"}};
let x6: ModelClass<MyModel, "ExtraItemInfo">;
let x6pk: PKofModelClass<ExtraItemInfo> = {item: {order: {id: 123}, product: {code: "123"}}};



