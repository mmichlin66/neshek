import { SchemaDef } from "../index"
import { MyModel } from "./TestModel"


export let mySchema: SchemaDef<MyModel> = {
    classes: {
        Order : {
            props: {
                id: {dt: "i8", required: true},
                time: {dt: "datetime", precision: 3},
                items: {dt: "multilink", origin: "Item", originKey: "order"},
                note: {dt: "obj", name: "Note"}
            },
            key: ["id"],
        },
        Product: {
            props: {
                code: {dt: "str", minlen: 8, maxlen: 8, },
                name: {dt: "str", minlen: 1, maxlen: 100},
                msrp: {dt: "dec", min: 0, precision: [10,2], },
                items: {dt: "multilink", origin: "Item", originKey: "product"},
                notes: {dt: "arr", elm: {dt: "obj", name: "Note"}}
            },
            key: ["code"],
        },
        Item: {
            props: {
                order: {dt: "link", target: "Order"},
                product: {dt: "link", target: "Product"},
                qty: {dt: "i2", min: 0},
                price: {dt: "real", min: 0},
                abc: {dt: "i4"},
                xyz: {dt: "str"},
                klm: {dt: "bool"},
                managerNote: {dt: "obj", props: {manager: {dt: "str"}, note: {dt: "obj", name: "Note"}}}
            },
            key: ["order", "product"],
        },
        ExtraItemInfo: {
            props: {
                item: {dt: "link", target: "Item"},
                // comments: {dt: "arr", elm: {dt: "str"}},
                comments: {dt: "str"},
            },
            key: ["item"],
        },
        Person: {
            props: {
                fn: {dt: "str"},
                ln: {dt: "str"},
                dob: {dt: "str"},
                address: {dt: "str"},
                phones: {dt: "arr", elm: {dt: "str"}},
            },
            key: ["fn", "ln", "dob"],
        },
    },

    structs: {
        Note: {
            time: {dt: "i8"},
            text: {dt: "str", maxlen: 200}
        }
    }
}



