import { IRepository, AModel, SchemaDef } from "../index"
import { mySchema } from "./TestSchema";


function createRepo<M extends AModel>(schema: SchemaDef<M>): IRepository<M>
{
    return {} as IRepository<M>;
}

let repo = createRepo(mySchema);
let session = repo.createSession();

let product = await session.get("Product", {code: "123"}, {
    msrp: undefined,
    // notes: {
    //     props: {
    //         text: undefined,
    //         time: undefined,

    //         // @ts-expect-error (a is not in Item)
    //         a: undefined,
    //     }
    // },

    // @ts-expect-error (not property of Product) - not working for Product
    a: undefined,
});

let product1 = await session.get("Product", {code: "123"}, {
    _: ["msrp"],
    // notes: {
    //     props: ["text", "time"],
    //     limit: 3,
    // },

    // @ts-expect-error (not property of Product)
    a: undefined,
});

// @ts-expect-error (id is not primary key)
let product12 = await session.get("Product", {id: "123"});

let product3 = await session.get("Product", {code: "123"}, {
    _: "msrp",
    // notes: "text, time",
});

let order = await session.get("Order", {id: 123}, {
    id: undefined,
    items: {
        props: {
            price: 2 // filters items with price = 2
        }
    },

    // @ts-expect-error (not property of Order)
    a: undefined,
});

let order1 = await session.get("Order", {id: 123}, ["id", "items"]);

let item = await session.get("Item", {order: {id: 123}, product: {code: "123"}}, {
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

let item1 = await session.get("Item", {order: {id: 123}, product: {code: "123"}}, ["order", "product", "price"]);

// @ts-expect-error (id is not primary key)
let item2 = await session.get("Item", {order: {id: 123}, product: {id: "123"}});

let extraItemInfo = await session.get("ExtraItemInfo", {item: {order: {id: 123}, product: {code: "123"}}});

// @ts-expect-error (Note is not a class)
let note = await session.get("Note", {id: 123});

let items = await session.query("Item", {filter: item => item.price.$eq(item.product.msrp)});
items = await session.query("Item", {filter: item => item.price.$eq(9.95)});
items = await session.query("Item", {filter: item => item.order.$isDefined()});



