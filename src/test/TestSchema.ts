import { IDBAdapter, Schema, SchemaModel, createRepo } from "neshek"
import { MyModel } from "./TestModel"



export let MySchema: Schema<MyModel> = {
    classes: {
        "Order" : {
            props: {
                id: {dt: "i8"},
                items: {dt: "ml", origin: ["Item", "order"]}
            },
        },
        "Product": {
            props: {
                code: {dt: "s"},
                name: {dt: "s", minlen: 3, maxlen: 100},
                msrp: {dt: "f", min: 0},
                notes: {dt: "arr", elm: {dt: "struct", props: {time: {dt: "i4"}, text: {dt: "s", maxlen: 200}}}}
            },
        },
        "Item": {
            props: {
                order: {dt: "l", target: "Order"},
                product: {dt: "l", target: "Product"},
                price: {dt: "f", min: 0},
            },
        },
    },

    structs: {
        "Note": {
            time: {dt: "i4"},
            text: {dt: "s", maxlen: 200}
        }
    }
}



let X: SchemaModel<Schema<MyModel>> = {} as SchemaModel<typeof MySchema>;


let repo = createRepo(MySchema, {} as IDBAdapter);
let product = repo.get("Product", {code: "123"});
let order = repo.get("Order", {id: 123});
let item = repo.get("Item", {order: {id: 123}, product: {code: "123"}});



