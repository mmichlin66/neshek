import { SampleRdbAdapter } from "./SampleRdbAdapter";
import { myHints } from "./TestRdbTypes";
import { mySchema } from "./TestSchema";




export function testSampleRdbAdapter_insert_get(): void
{
    let db = new SampleRdbAdapter(mySchema, myHints);

    db.insert("Product", {code: "123", name: "fork", msrp: 8.95});
    db.insert("Order", {id: 123, time: new Date()});
    db.insert("Item", {order: {id: 123}, product: {code: "123"}, price: 7.5});
    db.insert("ExtraItemInfo", {item: {product: {code: "123"}, order: {id: 123}}, comments: "This is a comment"});

    let product = db.get("Product", {code: "123"}, ["code", "name", "msrp"]);
    let order = db.get("Order", {id: 123}, ["id", "time"]);
    let item = db.get("Item", {order: {id: 123}, product: {code: "123"}}, ["order", "product", "price"]);
    let extraItemInfo = db.get("ExtraItemInfo", {item: {product: {code: "123"}, order: {id: 123}}}, ["comments"]);

    console.log();
}



