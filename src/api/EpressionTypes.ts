export type TermKind = "lit" | "var" | "op" | "func";

export type LangDataType = string | number | bigint | boolean;

export type TermDataType = "string" | "int" | "real" | "decimal" | "bool" | "datetime";

export type TermBase<K extends TermKind, DT extends TermDataType> = {
    kind: K;
    dt: DT;
}

export type LangToTerm<T extends LangDataType> =
    T extends string ? "string" | "datetime" :
    T extends number ? "int" | "real" | "decimal" :
    T extends bigint ? "int" :
    T extends boolean ? "bool" :
    never;

export type TermToLang<DT extends TermDataType> =
    DT extends "string" | "datetime" ? string :
    DT extends "int" | "real" | "decimal" ? number | bigint :
    DT extends "bool" ? boolean :
    never;



export type LiteralTerm<DT extends TermDataType> = TermBase<"lit", DT> &
    {
        v: TermToLang<DT>;
    }



// export type ExpressionFunction = (...args: any[]) => TermBase<TermKind, TermDataType>;
// export type ExpressionFunction = (...args: any[]) => any;

export type FuncTerm<FN extends string, F extends (...args: TermDataType[]) => TermDataType> =
    TermBase<"func", ReturnType<F>> &
    {
        /** Function name */
        func: FN;

        /** Function parameters */
        args: { [i in number & keyof Parameters<F>]:
            Parameters<F>[i] extends infer DT extends TermDataType ? TermToLang<DT> : never /*| TermBase<TermKind, Parameters<F>[i]>*/ };
    }



function foo(s: "string", start: "int", end: "int", x: "bool"): "string" { return "string"; }
type Params = Parameters<typeof foo>
let params: Parameters<typeof foo>
type args = { [i in number & keyof Params]:
    Params[i] extends infer DT ?  DT extends TermDataType ? TermToLang<DT> : never : never
};
type p1 = TermToLang<Params[0]>
type p2 = typeof params[1]
type p4 = (typeof params)[3]

let term1: FuncTerm<"minus", (x: "int", y: "int") => "int">;
type FirstParam1 = (typeof term1)["args"][0];
let fp1: FirstParam1;

let term2: FuncTerm<"substr", (s: "string", start: "int", end: "int", x: "bool") => "string">;
type FirstParam2 = (typeof term2)["args"][0];
let fp2: FirstParam2;
type SecondParam2 = (typeof term2)["args"][1];
let sp2: SecondParam2;
type ThirdParam2 = (typeof term2)["args"][2];
let tp2: ThirdParam2;

let term3: FuncTerm<"and", (...args: "bool"[]) => "bool">;
type FirstParam3 = (typeof term3)["args"][0];
let fp3: FirstParam3;
type SecondParam3 = (typeof term3)["args"][1];
let sp3: SecondParam3;

let term4: FuncTerm<"and", () => "bool">;
// z@ts-expect-error
type FirstParam4 = (typeof term4)["args"][0];
let fp4: FirstParam4;




