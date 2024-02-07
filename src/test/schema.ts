import { Schema } from "neshek"
import { MySchemaTypes } from "./model"



let MySchema: Schema<MySchemaTypes> = {
    classes: {
        "Order" : {
            props: {
                id: {dt: "i8"},
                items: {dt: "ml", origin: ["Item", "order"]}
            },
        },
        "Item": {
            props: {
                id: {dt: "i8"},
                order: {dt: "l", target: "Order"},
                product: {dt: "l", target: "Product"},
                price: {dt: "f", min: 0},
            },
        },
        "Product": {
            props: {
                id: {dt: "i8"},
                name: {dt: "s", minlen: 3, maxlen: 100},
                msrp: {dt: "f", min: 0},
                notes: {dt: "arr", elm: {dt: "struct", props: {time: {dt: "i4"}, text: {dt: "s", maxlen: 200}}}}
            },
        }
    },

    structs: {
        "Note": {
            time: {dt: "i4"},
            text: {dt: "s", maxlen: 200}
        }
    }
}



