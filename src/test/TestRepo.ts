import { IDBAdapter, createRepo } from "neshek"
import { mySchema } from "./TestSchema";


let repo = createRepo(mySchema, {} as IDBAdapter);

let product = await repo.get("Product", {code: "123"}, {
    msrp: false,
    notes: {
        props: {
            text: false,
            time: false,

            // @ts-expect-error (a is not in Item)
            a: false,
        }
    },

    // // @ts-expect-error (not property of Product)
    // a: false,
});

let order = repo.get("Order", {id: 123}, {
    id: false,

    // @ts-expect-error (not property of Order)
    a: false,
});

let item = repo.get("Item", {order: {id: 123}, product: {code: "123"}}, {
    price: false,
    order: {
        id: false,
    },
    product: {
        code: false,
        msrp: false,
    },

    // @ts-expect-error (not property of Item)
    a: false,
});

let extraItemInfo = repo.get("ExtraItemInfo", {item: {order: {id: 123}, product: {code: "123"}}});

// @ts-expect-error (Note is not a class)
let note = repo.get("Note", {id: 123});

// @ts-expect-error (id is not primary key)
let product1 = repo.get("Product", {id: "123"});

// @ts-expect-error (id is not primary key)
let item1 = repo.get("Item", {order: {id: 123}, product: {id: "123"}});



