import { ModelClass, ModelClassName, ModelClasses, Model } from "../api/SchemaTypes";

export interface Order// extends ISchemaClass<number>
{
    id?: number;
    items?: Item[];
}

export interface Product// extends ISchemaClass<string>
{
    code?: string;
    name?: string;
    msrp?: number;
    notes?: Note[];
}

export interface Note// extends ISchemaClass<undefined>
{
    time?: number;
    text?: string;
}

export interface Item// extends ICrossLink<Order, Product>
{
    order?: Order;
    product?: Product;
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
// let x3pk: SchemaClassKey<Order>;
// let x4: SchemaClass<MyModel, "Product">;
// let x4pk: SchemaClassKey<Product>;
// let x5: SchemaClass<MyModel, "Item">;
// let x5pk: SchemaClassKey<Item>;



