import { ModelClass, ModelClassName, ModelClasses, Model, NeshekClass, KeyOfModelClass, MultiLink, NameOfClass } from "neshek";
import { XOR } from "../api/UtilTypes";

export type Order = NeshekClass<"Order", {id: number}> &
{
    items?: MultiLink<Item>;
}

export type Product = NeshekClass<"Product", {code: string}> &
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

export type Item = NeshekClass<"Item", {order: Order, product: Product}> &
{
    price?: number;
}

export type ExtraItemInfo = NeshekClass<"ExtraItemInfo", {item: Item}> &
{
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
let order: ModelClass<MyModel, "Order"> = {id: 123};
let orderName: NameOfClass<Order> = "Order";
let orderKey: KeyOfModelClass<Order> = {id: 123};
let product: ModelClass<MyModel, "Product"> = {code: "123", msrp: 35.99, name: "desk", notes: [{}]};
let productName: NameOfClass<Product> = "Product";
let productKey: KeyOfModelClass<Product> = {code: "123"};
let item: ModelClass<MyModel, "Item"> = {order: {id: 123}, product: {code: "123"}, price: 30.99};
let itemName: NameOfClass<Item> = "Item";
let itemKey: KeyOfModelClass<Item> = {order: {id: 123}, product: {code: "123"}};
let extraItemInfo: ModelClass<MyModel, "ExtraItemInfo"> =
    {comments: ["first", "second"], item: {order: {id: 123}, product: {code: "123"}}};
let extraItemInfoName: NameOfClass<ExtraItemInfo> = "ExtraItemInfo";
let extraItemInfoKey: KeyOfModelClass<ExtraItemInfo> = {item: {order: {id: 123}, product: {code: "123"}}};

// @ts-expect-error (should be either code or id)
let x7pk: XOR<[KeyOfModelClass<Order>, KeyOfModelClass<Product>]> = {code: "123", id: 123};



