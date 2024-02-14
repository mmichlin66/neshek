import {
    ModelClass, ModelClassName, ModelClasses, Model, Class, KeyOfClass, MultiLink, NameOfClass,
    ModelStructName, ModelStructs, Struct
} from "neshek";
import { XOR } from "../api/UtilTypes";



export type Order = Class<"Order", {id: number}> &
{
    time?: Date;
    items?: MultiLink<Item>;
    note?: Note;
}

export type Product = Class<"Product", {code: string}> &
{
    name?: string;
    msrp?: number;
    items?: MultiLink<Item>;
    notes?: Note[];
}

export type Item = Class<"Item", {order: Order, product: Product}> &
{
    price?: number;
    managerNotes?: {manager: string, note: Note}
}

export type ExtraItemInfo = Class<"ExtraItemInfo", {item: Item}> &
{
    comments: string[];
}

export type Note = Struct<"Note"> &
{
    time?: number;
    text?: string;
}

export type MyModel = Model<
    [Order, Product, Item, ExtraItemInfo],
    [Note]
>;



function test(): void
{
    let classes: ModelClasses<MyModel>;
    let classNames: ModelClassName<MyModel> = "Item";
    let order: ModelClass<MyModel, "Order"> = {id: 123};
    let orderName: NameOfClass<Order> = "Order";
    let orderKey: KeyOfClass<Order> = {id: 123};
    let product: ModelClass<MyModel, "Product"> = {code: "123", msrp: 35.99, name: "desk", notes: [{}]};
    let productName: NameOfClass<Product> = "Product";
    let productKey: KeyOfClass<Product> = {code: "123"};
    let item: ModelClass<MyModel, "Item"> = {order: {id: 123}, product: {code: "123"}, price: 30.99};
    let itemName: NameOfClass<Item> = "Item";
    let itemKey: KeyOfClass<Item> = {order: {id: 123}, product: {code: "123"}};
    let extraItemInfo: ModelClass<MyModel, "ExtraItemInfo"> =
        {comments: ["first", "second"], item: {order: {id: 123}, product: {code: "123"}}};
    let extraItemInfoName: NameOfClass<ExtraItemInfo> = "ExtraItemInfo";
    let extraItemInfoKey: KeyOfClass<ExtraItemInfo> = {item: {order: {id: 123}, product: {code: "123"}}};

    // @ts-expect-error (should be either code or id)
    let x7pk: XOR<[KeyOfClass<Order>, KeyOfClass<Product>]> = {code: "123", id: 123};

    let structs: ModelStructs<MyModel>;
    let structNames: ModelStructName<MyModel> = "Note";
}



