import * as model from "./test/TestModel"
import { RdbAdapter } from "./api/RdbAdapter";
import * as schema from "./test/TestSchema"
import * as hints from "./test/TestRDBTypes"



let db = new RdbAdapter(schema.mySchema, hints.myHints);
let obj = db.get("Product", {code: "123"}, ["code", "name", "msrp"]);
let code = obj?.code;
console.log("code = ", code);



