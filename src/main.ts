import * as model from "./test/TestModel"
import * as schema from "./test/TestSchema"
import * as hints from "./test/TestRDBTypes"
import { RDBAdapter } from "./api/RDBAdapter";
import { ASchemaDef } from "./api/SchemaTypes";



let db = new RDBAdapter(schema.mySchema as ASchemaDef, hints.myHints);
let obj = db.get("Product", {code: "123"}, ["code", "name", "msrp"]);
let code = obj?.code;
console.log("code = ", code);



