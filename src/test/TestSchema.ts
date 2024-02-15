import { SchemaDef } from "neshek"
import { MyModel } from "./TestModel"



export let mySchema: SchemaDef<MyModel> = {
    classes: {
        "Order" : {
            props: {
                id: {dt: "i8"},
                time: {dt: "ts", precision: "s"},
                items: {dt: "ml", origin: "Item", originKey: ["order"]},
                note: {dt: "obj", name: "Note"}
            },
            key: ["id"],
        },
        "Product": {
            props: {
                code: {dt: "s", minlen: 8, maxlen: 8},
                name: {dt: "s", minlen: 3, maxlen: 100},
                msrp: {dt: "n", min: 0, prescision: [10,2]},
                items: {dt: "ml", origin: "Item", originKey: ["product"]},
                notes: {dt: "arr", elm: {dt: "obj", name: "Note"}}
            },
            key: ["code"],
        },
        "Item": {
            props: {
                order: {dt: "l", target: "Order", keyProps: {id: "order_id"}},
                product: {dt: "l", target: "Product", keyProps: {code: "product_code"}},
                price: {dt: "r4", min: 0},
                managerNotes: {dt: "obj", props: {manager: {dt: "s"}, note: {dt: "obj", name: "Note"}}}
            },
            key: ["order", "product"],
        },
        "ExtraItemInfo": {
            props: {
                item: {dt: "l", target: "Item", keyProps: {order: {id: "order_id"}, product: {code: "product_code"}}},
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



