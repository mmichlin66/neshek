export type TermKind = "lit" | "var" | "op" | "func";

export type LangDataType = string | number | bigint | boolean;

export type TermDataType = "string" | "int" | "real" | "decimal" | "bool" | "datetime";

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



export type TermBase<K extends TermKind, DT extends TermDataType> =
    {
        kind: K;
        dt: DT;
    } &
    (
        DT extends "string"
            ? { [op in keyof IStringFuncs as `$${op}`]-?: LangDataTypeFuncSugnature<IStringFuncs[op]> }
            : {}
    )



export type TermDataTypeFuncSignature = (...args: TermDataType[]) => TermDataType;

export type FuncParametersTuple<F extends TermDataTypeFuncSignature> =
    Parameters<F> extends [] ? [] : {
        [i in keyof Parameters<F>]: Parameters<F>[i] extends (infer DT extends TermDataType)
            ? TermToLang<DT> | TermBase<TermKind, DT>
            : any
    };

export type LangDataTypeFuncSugnature<F extends TermDataTypeFuncSignature> =
    (...args: FuncParametersTuple<F> & any[]) => TermBase<TermKind, ReturnType<F>>




export type LiteralTerm<DT extends TermDataType> = TermBase<"lit", DT> &
    {
        v: TermToLang<DT>;
    }



export type FuncTerm<FN extends string, F extends TermDataTypeFuncSignature> =
    TermBase<"func", ReturnType<F>> &
    {
        /** Function name */
        func: FN;

        /** Function parameters */
        args: FuncParametersTuple<F>;
    }



type Term2 = FuncTerm<"foo", (s: "string", start: "int", x: "bool") => "string">;
type FirstParam2 = Term2["args"][0];
let fp2: FirstParam2;
type SecondParam2 = Term2["args"][1];
let sp2: SecondParam2;
type ThirdParam2 = Term2["args"][2];
let tp2: ThirdParam2;
let term2: Term2 = {} as Term2;
term2.$substr(1)

type Term3 = FuncTerm<"and", (...args: "bool"[]) => "bool">;
type FirstParam3 = Term3["args"][0];
let fp3: FirstParam3;
type SecondParam3 = Term3["args"][1];
let sp3: SecondParam3;

type Term4 = FuncTerm<"and", () => "bool">;
// @ts-expect-error - no element at index 0
type FirstParam4 = Term4["args"][0];

type Term5 = FuncTerm<"and", (first: "string", ...args: "bool"[]) => "bool">;
type FirstParam5 = Term5["args"][0];
let fp5: FirstParam5;
type SecondParam5 = Term5["args"][1];
let sp5: SecondParam5;



interface IFuncs
{
    [N: string]: (...args: TermDataType[]) => TermDataType;
}

interface IStringFuncs extends IFuncs
{
    // [N: string]: (...args: TermDataType[]) => TermDataType;

    substr: (start: "int") => "string"
}



type Func<T extends Array<any>> = (...args: T) => void;
type Tuple = [string, number];
type MyFunc = Func<Tuple>;
let fn: MyFunc = function (x: string, y: number): void {}
type Tuple1 = [];
type MyFunc1 = Func<Tuple1>;
let fn1: MyFunc1 = function (): void {}


