import { IDBAdapter, createRepo } from "neshek"
import { mySchema } from "./TestSchema";


let repo = createRepo(mySchema, {} as IDBAdapter);

let product = await repo.get("Product", {code: "123"}, {
    msrp: undefined,
    notes: {
        props: {
            text: undefined,
            time: undefined,

            // @ts-expect-error (a is not in Item)
            a: undefined,
        }
    },

    // ??? @ts-expect-error (not property of Product) - not working for Product
    a: undefined,
});

let order = repo.get("Order", {id: 123}, {
    id: undefined,
    items: {
        props: {
            price: 2
        }
    },

    // @ts-expect-error (not property of Order)
    a: undefined,
});

let item = repo.get("Item", {order: {id: 123}, product: {code: "123"}}, {
    price: undefined,
    order: {
        id: undefined,
    },
    product: {
        code: undefined,
        msrp: undefined,
    },

    // @ts-expect-error (not property of Item)
    a: undefined,
});

let extraItemInfo = repo.get("ExtraItemInfo", {item: {order: {id: 123}, product: {code: "123"}}});

// @ts-expect-error (Note is not a class)
let note = repo.get("Note", {id: 123});

// @ts-expect-error (id is not primary key)
let product1 = repo.get("Product", {id: "123"});

// @ts-expect-error (id is not primary key)
let item1 = repo.get("Item", {order: {id: 123}, product: {id: "123"}});



