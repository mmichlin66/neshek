import { IRepository, Model, SchemaDef } from "neshek"
import { mySchema } from "./TestSchema";


function createRepo<TModel extends Model>(schema: SchemaDef<TModel>): IRepository<TModel>
{
    return {} as IRepository<TModel>;
}

let repo = createRepo(mySchema);
let session = repo.createSession();

let product = await session.get("Product", {code: "123"}, {
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

let product1 = await session.get("Product", {code: "123"}, {
    fields: ["msrp"],
    notes: {
        props: ["text", "time"],
        limit: 3,
    },

    // @ts-expect-error (not property of Product)
    a: undefined,
});

// @ts-expect-error (id is not primary key)
let product12 = session.get("Product", {id: "123"});

let product3 = await session.get("Product", {code: "123"}, {
    fields: "msrp",
    notes: "text, time",
});

let order = session.get("Order", {id: 123}, {
    id: undefined,
    items: {
        props: {
            price: 2 // filters items with price = 2
        }
    },

    // @ts-expect-error (not property of Order)
    a: undefined,
});

let order1 = session.get("Order", {id: 123}, ["id", "items"]);

let item = session.get("Item", {order: {id: 123}, product: {code: "123"}}, {
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

let item1 = session.get("Item", {order: {id: 123}, product: {code: "123"}}, ["order", "product", "price"]);

// @ts-expect-error (id is not primary key)
let item2 = session.get("Item", {order: {id: 123}, product: {id: "123"}});

let extraItemInfo = session.get("ExtraItemInfo", {item: {order: {id: 123}, product: {code: "123"}}});

// @ts-expect-error (Note is not a class)
let note = session.get("Note", {id: 123});



