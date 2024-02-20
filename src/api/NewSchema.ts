export { XOR } from "./UtilTypes"



type DataType =
    "str" | "clob" |
    "bool" |
    "int" | "bigint" | "real" | "dec" | "bits" |
    "date" | "time" | "datetime" | "timestamp" |
    "link" | "multilink" |
    "obj" | "arr";

/**
 * Defines property definition attributes that are common for all data types
 */
type CommonPropDef =
{
    /**
     * Property's data type that determines its structure and meaning.
     */
    readonly dt: string,

    /**
     * Determines whether the field value must be unique across all objects of its class.
     * Default value: false.
     */
    readonly unique?: boolean;

    /**
     * Determines whether the field must have a non-null value in the repository.
     * Default value: false.
     */
    readonly required?: boolean;
}

/**
 * Contains attributes defining behavior of a string property
 */
type StringPropDef = CommonPropDef &
{
    readonly dt: "str";
    readonly minlen?: number;
    readonly maxlen?: number;
    readonly regex?: RegExp;
    readonly choices?: string[];
}

/**
 * Contains attributes defining behavior of an integer number property
 */
type IntPropDef = CommonPropDef &
{
    readonly dt: "int";
    readonly min?: number;
    readonly max?: number;
    readonly step?: number;
}



type PropDef = StringPropDef | IntPropDef;

type ClassDef =
{
    /**
     * Defenitions of class properties
     */
    readonly props: { readonly [P: string]: PropDef };

    /**
     * Defines what fields constitute a primary key for the class. The key can be a single field
     * or a collection of fields.
     */
    readonly key?: string & keyof ClassDef["props"] | readonly (string & keyof ClassDef["props"])[];

    // readonly key: string | readonly string[];
}

/**
 * Represents a Schema, which combines definitions of classes, structures and type aliases.
 */
type SchemaDef =
{
    readonly classes: { readonly [P: string]: ClassDef };
}



type SchemaClasses1<S> = S extends SchemaDef ? S["classes"] : never;
type SchemaClasses<S extends SchemaDef> = S["classes"];
type SchemaClassName<S extends SchemaDef> = keyof SchemaClasses<S>;

type SchemaClass<S extends SchemaDef, CN extends SchemaClassName<S>> =
    SchemaClasses<S>[CN];

type SchemaClassProps<S extends SchemaDef, CN extends SchemaClassName<S>> =
    SchemaClass<S,CN>["props"];

type SchemaClassPropName<S extends SchemaDef, CN extends SchemaClassName<S>> =
    keyof SchemaClassProps<S,CN>;

type SchemaClassProp<S extends SchemaDef, CN extends SchemaClassName<S>, PN extends SchemaClassPropName<S,CN>> =
    SchemaClassProps<S,CN>[PN];

type Class<S extends SchemaDef, CN extends SchemaClassName<S>> =
{
    -readonly [P in SchemaClassPropName<S,CN>]?:
        SchemaClassProp<S,CN,P>["dt"] extends "str" ? string :
        SchemaClassProp<S,CN,P>["dt"] extends "int" ? number :
        SchemaClassProp<S,CN,P>["dt"] extends "bool" ? boolean :
        never
}



const mySchema =//: SchemaDef =
{
    classes: {
        Order: {
            props: {
                id: {dt: "int"},
                time: {dt: "int", min: 0},
                // items: {dt: "multilink", origin: "Item", originKey: "order"},
                // note: {dt: "obj", name: "Note"}
            },
            key: "id",
        },
        Product: {
            props: {
                code: {dt: "str", minlen: 8, maxlen: 8, },
                name: {dt: "str", minlen: 3, maxlen: 100},
                msrp: {dt: "int", min: 0, },
                // items: {dt: "multilink", origin: "Item", originKey: "product"},
                // notes: {dt: "arr", elm: {dt: "obj", name: "Note"}}
            },
            key: "code",
        },
        // "Item": {
        //     props: {
        //         order: {dt: "link", target: "Order"},
        //         product: {dt: "link", target: "Product"},
        //         price: {dt: "real", min: 0},
        //         managerNotes: {dt: "obj", props: {manager: {dt: "str"}, note: {dt: "obj", name: "Note"}}}
        //     },
        //     key: ["order", "product"],
        // },
        // "ExtraItemInfo": {
        //     props: {
        //     item: {dt: "link", target: "Item", /*keyProps: {order: {id: "order_id"}, product: {code: "product_code"}}*/},
        //         comments: {dt: "arr", elm: {dt: "str"}},
        //     },
        //     key: ["item"],
        // },
    }
} as const;


type classes = SchemaClasses1<typeof mySchema>;
type cls = SchemaClass<typeof mySchema, "Order">;
type props = SchemaClassProps<typeof mySchema, "Order">;
type prop = SchemaClassProp<typeof mySchema, "Order", "id">;
type Order = Class<typeof mySchema, "Order">;
type Product = Class<typeof mySchema, "Product">;



