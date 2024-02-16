import { RDBSchemaHints } from "neshek"
import { MyModel } from "./TestModel"



export let mySchema: RDBSchemaHints<MyModel> = {
    classes: {
        "Order" : {
            tableName: "orders",
            props: {
                id: {typeName: "bigint"},
                time: {typeName: "timestamp(3)"},
            },
        },
        "Product": {
            props: {
                code: {typeName: "char(8)", },
                notes: {typeName: "varchar"}
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



