import { ModelClass, ModelClassName, ModelClasses, Model, NeshekClass, PKofModelClass } from "neshek";

export type Order = NeshekClass &
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

export interface MyClasses
{
    Order: Order;
    Item: Item;
    Product: Product;
}

export interface MyStructs
{
    Note: Note;
}

export type MyModel = Model<MyClasses, MyStructs>;



let x1: ModelClasses<MyModel>;
let x2: ModelClassName<MyModel> = "Item";
let x3: ModelClass<MyModel, "Order">;
let x3pk: PKofModelClass<Order>;
let x4: ModelClass<MyModel, "Product">;
let x4pk: PKofModelClass<Product>;
let x5: ModelClass<MyModel, "Item">;
let x5pk: PKofModelClass<Item>;



