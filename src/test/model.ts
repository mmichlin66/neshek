import { SchemaTypes, Schema } from "../api/CoreTypes";

export interface Order
{
    id?: number;
    items?: Item[];
}

export interface Item
{
    id?: number;
    order?: Order;
    product?: Product;
    price?: number;
}

export interface Product
{
    id?: number;
    name?: string;
    msrp?: number;
    notes?: Note[];
}

export interface Note
{
    time?: number;
    text?: string;
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

export interface MySchemaTypes extends SchemaTypes<MyClasses, MyStructs>
{
}