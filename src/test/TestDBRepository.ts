import { DBRepository } from "../api/DBRepository";
import { SampleRdbAdapter } from "./SampleRdbAdapter";
import { myHints } from "./TestRdbTypes";
import { mySchema } from "./TestSchema";




export async function testDBRepository_insert_get(): Promise<void>
{
    let db = new SampleRdbAdapter(mySchema, myHints);
    let repo = new DBRepository(mySchema, db);
    let repoSession = repo.createSession();

    await repoSession.insert("Product", {code: "123", name: "fork", msrp: 8.95});
    await repoSession.insert("Order", {id: 123, time: new Date()});
    await repoSession.insert("Item", {order: {id: 123}, product: {code: "123"}, price: 7.5});
    await repoSession.insert("ExtraItemInfo", {item: {product: {code: "123"}, order: {id: 123}}, comments: "This is a comment"});

    // inserting an object with already existing key
    try { await repoSession.insert("Product", {code: "123", name: "spoon", msrp: 10.95}); }
    catch(x) {
        console.log(x);
    }

    let product = await repoSession.get("Product", {code: "123"}, ["code", "name", "msrp"]);
    product = await repoSession.get("Product", {code: "123"});
    product = await repoSession.get("Product", {code: "123"}, "name");

    let order = await repoSession.get("Order", {id: 123}, ["id", "time"]);
    let item = await repoSession.get("Item", {order: {id: 123}, product: {code: "123"}}, ["order", "product", "price"]);
    let extraItemInfo = await repoSession.get("ExtraItemInfo", {item: {product: {code: "123"}, order: {id: 123}}}, ["comments"]);

    // getting object with invalid property
    try { product = await repoSession.get("Product", {code: "123"}, "msrpX" as "msrp"); }
    catch(x) {
        console.log(x);
    }

    extraItemInfo = await repoSession.get("ExtraItemInfo", {item: {product: {code: "123"}, order: {id: 123}}}, {
        comments: undefined,
        item: {
            product: "msrp",
            order: {
                time: undefined,
                id: undefined,
            }
        }
    });

    extraItemInfo = await repoSession.get("ExtraItemInfo", {item: {product: {code: "123"}, order: {id: 123}}},
        ["comments", "item"]);

    console.log("Finished");
}



