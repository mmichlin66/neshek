import { RdbSchemaHints } from "../index"
import { MyModel } from "./TestModel"



export let myHints: RdbSchemaHints<MyModel> = {
    classes: {
        Order : {
            tableName: "orders",
            props: {
                id: {ft: "bigint"},
                time: {ft: "timestamp(3)"},
            },
        },
        Product: {
            props: {
                code: {ft: "char(8)", },
                name: {ft: "nvarchar(50)", },
                // notes: {ft: "varchar"},
                msrp: {name: "price", ft: "decimal(10.2)"}
            },
        },
        Item: {
            props: {
                order: {id: {name: "order_id"}},
                product: {code: {name: "product_code"}},
            },
        },
        ExtraItemInfo: {
            tableName: "extra_info_objects",
            props: {
                item: {order: {id: {name: "orderId", ft: "int"}}, product: {code: {name: "productCode"}}},
            },
        },
    },
}



