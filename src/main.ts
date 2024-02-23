import * as model from "./test/TestModel"
import * as schema from "./test/TestSchema"
import * as hints from "./test/TestRdbTypes"
import { TestRdbAdapter } from "./test/TestRdbAdapter";
import { RdbAdapter } from "./api/RdbAdapter";


let db = new TestRdbAdapter(schema.mySchema, hints.myHints);
let obj = db.get("Product", {code: "123"}, ["code", "name", "msrp"]);
 obj = db.get("Item", {product: {code: "123"}, order: {id: 123}}, ["price"]);
 obj = db.get("ExtraItemInfo", {item: {product: {code: "123"}, order: {id: 123}}}, ["price"]);
//  obj = db.get("ExtraItemInfo", {product: {code: "123"}, order: {id: 123}}, ["price"]);
 obj = db.get("Person", {fn: "Misha", ln: "Michlin", dob: "11/11/1966"}, ["address", "phone"]);

 let code = obj?.code;
// console.log("code = ", code);



