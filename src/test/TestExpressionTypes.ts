import { Expression, MappedParamsTuple } from "../index";



function test()
{
    type T1 = MappedParamsTuple<["str", boolean, "i4"?]>;
    type T2 = MappedParamsTuple<["str", boolean | null, "i4"?]>;
    type T3 = MappedParamsTuple<[]>;
    type T4 = MappedParamsTuple<["str"?]>;



    let e1 = {} as Expression<"str">;
    e1.$substr(1).$concat("a", "b", "c").$match("abc").$coalesce().$isNull()
    e1.$toCHAR(20).$concat("")

    let e2 = {} as Expression<"i4">;
    let res = e2.$minus(1, 2, 3).$abs();
    e1.$toDECIMAL(10, 2).$abs()



    // type Term2 = FuncExpr<"foo", (s: "str", start: "i4", x: "bool") => "str">;
    // type FirstParam2 = Term2["args"][0];
    // let fp2: FirstParam2;
    // type SecondParam2 = Term2["args"][1];
    // let sp2: SecondParam2;
    // type ThirdParam2 = Term2["args"][2];
    // let tp2: ThirdParam2;
    // let term2 = {} as Term2;

    // type Term3 = FuncExpr<"and", (...args: "bool"[]) => "i4">;
    // type FirstParam3 = Term3["args"][0];
    // let fp3: FirstParam3;
    // type SecondParam3 = Term3["args"][1];
    // let sp3: SecondParam3;
    // let term3 = {} as Term3;

    // type Term4 = FuncExpr<"and", () => "bool">;
    // // @ts-expect-error - no element at index 0
    // type FirstParam4 = Term4["args"][0];

    // type Term5 = FuncExpr<"and", (first: "str", ...args: "bool"[]) => "bool">;
    // type FirstParam5 = Term5["args"][0];
    // let fp5: FirstParam5;
    // type SecondParam5 = Term5["args"][1];
    // let sp5: SecondParam5;
}



