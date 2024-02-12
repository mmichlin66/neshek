import { SchemaDef } from "neshek"
import { MyModel } from "./TestModel"


export let mySchema: SchemaDef<MyModel> = {
    classes: {
        "Order" : {
            props: {
                id: {dt: "i8"},
                items: {dt: "ml", origin: "Item", originKey: ["order"]},
            },
            key: ["id"],
        },
        "Product": {
            props: {
                code: {dt: "s"},
                name: {dt: "s", minlen: 3, maxlen: 100},
                msrp: {dt: "r4", min: 0},
                notes: {dt: "arr", elm: {dt: "struct", props: {time: {dt: "i4"}, text: {dt: "s", maxlen: 200}}}}
            },
            key: ["code"],
        },
        "Item": {
            props: {
                order: {dt: "l", target: "Order"},
                product: {dt: "l", target: "Product"},
                price: {dt: "r4", min: 0},
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



