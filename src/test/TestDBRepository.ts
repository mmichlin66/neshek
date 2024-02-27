import { DBRepository } from "../api/DBRepository";
import { SampleRdbAdapter } from "./SampleRdbAdapter";
import { myHints } from "./TestRdbTypes";
import { mySchema } from "./TestSchema";




export async function testDBRepository_insert_get(): Promise<void>
{
    let db = new SampleRdbAdapter(mySchema, myHints);

    await db.insert("Product", {code: "123", name: "fork", msrp: 8.95});
    await db.insert("Order", {id: 123, time: new Date()});
    await db.insert("Item", {order: {id: 123}, product: {code: "123"}, price: 7.5});
    await db.insert("ExtraItemInfo", {item: {product: {code: "123"}, order: {id: 123}}, comments: "This is a comment"});

    let repo = new DBRepository(mySchema, db);
    let repoSession = repo.createSession();

    let product = await repoSession.get("Product", {code: "123"}, ["code", "name", "msrp"]);
    product = await repoSession.get("Product", {code: "123"});
    product = await repoSession.get("Product", {code: "123"}, "name");

    let order = await repoSession.get("Order", {id: 123}, ["id", "time"]);
    let item = await repoSession.get("Item", {order: {id: 123}, product: {code: "123"}}, ["order", "product", "price"]);
    let extraItemInfo = await repoSession.get("ExtraItemInfo", {item: {product: {code: "123"}, order: {id: 123}}}, ["comments"]);

    try { let product = await repoSession.get("Product", {code: "123"}, "msrpX" as "msrp"); }
    catch(x) {
        console.log(x);
    }

    try { await db.insert("Product", {code: "123", name: "spoon", msrp: 10.95}); }
    catch(x) {
        console.log(x);
    }

    console.log("Finished");
}



