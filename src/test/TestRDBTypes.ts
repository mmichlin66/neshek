import { RDBSchemaHints } from "neshek"
import { MyModel } from "./TestModel"



export let mySchema: RDBSchemaHints<MyModel> = {
    classes: {
        "Order" : {
            tableName: "orders",
            props: {
                id: {columnType: "bigint"},
                time: {columnType: "timestamp(3)"},
            },
        },
        "Product": {
            props: {
                code: {columnType: "char(8)", },
                notes: {columnType: "varchar"},
                msrp: {name: "price", columnType: "decimal(10.2)"}
            },
        },
        "Item": {
            props: {
                order: {id: {name: "order_id"}},
                product: {code: {name: "product_code"}},
            },
        },
        "ExtraItemInfo": {
            props: {
                item: {order: {id: {name: "order_id"}}, product: {code: {name: "product_code"}}},
            },
        },
    },
}



