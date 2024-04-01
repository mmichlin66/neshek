import { SampleRdbAdapter } from "./SampleRdbAdapter";
import { myHints } from "./TestRdbTypes";
import { mySchema } from "./TestSchema";




export async function testSampleRdbAdapter_insert_get(): Promise<void>
{
    let db = new SampleRdbAdapter(mySchema, myHints);

    await db.insert("Product", {code: "123", name: "fork", msrp: 8.95});
    await db.insert("Order", {id: 123, time: new Date()});
    await db.insert("Item", {order: {id: 123}, product: {code: "123"}, price: 7.5});
    await db.insert("ExtraItemInfo", {item: {product: {code: "123"}, order: {id: 123}}, comments: "This is a comment"});

    let product = await db.get("Product", {code: "123"}, ["code", "name", "msrp"]);
    let order = await db.get("Order", {id: 123}, ["id", "time"]);
    let item = await db.get("Item", {order: {id: 123}, product: {code: "123"}}, ["order", "product", "price"]);
    let extraItemInfo = await db.get("ExtraItemInfo", {item: {product: {code: "123"}, order: {id: 123}}}, ["comments"]);

    console.log();
}



