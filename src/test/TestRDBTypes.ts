import { RDBSchemaHints } from "neshek"
import { MyModel } from "./TestModel"



export let myHints: RDBSchemaHints<MyModel> = {
    classes: {
        "Order" : {
            tableName: "orders",
            props: {
                id: {ft: "bigint"},
                time: {ft: "timestamp(3)"},
            },
        },
        "Product": {
            props: {
                code: {ft: "char(8)", },
                notes: {ft: "varchar"},
                msrp: {name: "price", ft: "decimal(10.2)"}
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
                item: {order: {id: {name: "orderId", ft: "int"}}, product: {code: {name: "productCode"}}},
            },
        },
    },
}



