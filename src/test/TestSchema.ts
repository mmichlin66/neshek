import { IDBAdapter, PKofSchemaClass, Schema, SchemaClass, SchemaClassName, SchemaClasses, SchemaModel, createRepo } from "neshek"
import { MyModel } from "./TestModel"


export let mySchema: Schema<MyModel> = {
    classes: {
        "Order" : {
            props: {
                id: {dt: "i8"},
                items: {dt: "ml", origin: ["Item", "order"]},
            },
            key: ["id"],
        },
        "Product": {
            props: {
                code: {dt: "s"},
                name: {dt: "s", minlen: 3, maxlen: 100},
                msrp: {dt: "f", min: 0},
                notes: {dt: "arr", elm: {dt: "struct", props: {time: {dt: "i4"}, text: {dt: "s", maxlen: 200}}}}
            },
            key: ["code"],
        },
        "Item": {
            props: {
                order: {dt: "l", target: "Order"},
                product: {dt: "l", target: "Product"},
                price: {dt: "f", min: 0},
            },
            key: ["order", "product"],
        },
        "ExtraItemInfo": {
            props: {
                item: {dt: "l", target: "Item"},
                comments: {dt: "arr", elm: {dt: "s"}},
            },
            key: ["item"],
        },
    },

    structs: {
        "Note": {
            time: {dt: "i4"},
            text: {dt: "s", maxlen: 200}
        }
    }
}

export type MySchema = typeof mySchema;



let x0: SchemaModel<MySchema>;
let x1: SchemaClasses<MySchema>;
let x2: SchemaClassName<MySchema> = "Item";
let x3: SchemaClass<MySchema, "Order">;
let x3pk: PKofSchemaClass<MySchema, "Order">;
let x4: SchemaClass<MySchema, "Product">;
let x4pk: PKofSchemaClass<MySchema, "Product">;
let x5: SchemaClass<MySchema, "Item">;
let x5pk: PKofSchemaClass<MySchema, "Item">;
let x6: SchemaClass<MySchema, "ExtraItemInfo">;
let x6pk: PKofSchemaClass<MySchema, "ExtraItemInfo">;



let repo = createRepo(mySchema, {} as IDBAdapter);
let product = await repo.get("Product", {code: "123", });
let order = repo.get("Order", {id: 123});
let item = repo.get("Item", {order: {id: 123}, product: {code: "123"}});
let extraItemInfo = repo.get("ExtraItemInfo", {item: {order: {id: 123}, product: {code: "123"}}});

// @ts-expect-error (Note is not a class)
let note = repo.get("Note", {id: 123});



