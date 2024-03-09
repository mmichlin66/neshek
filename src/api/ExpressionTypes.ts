import { DataType, LangTypeOf, NumericDataType, StringDataType } from "./BasicTypes";



/**
 * Kinds of expressions:
 * - lit - wraps a literal value passed as a language-specific type with indication of the data type.
 * - var - wraps a "variable"
 * - func - function invocation
 * - op - arithmetic or logical operation. They are very similar to function invocation; however
 *   operations have different precedence rules.
 */
export type ExprKind = "lit" | "var" | "func" | "op";



/**
 * Function signature expressed via DataType types (instead of language types). This is used
 * to represent data types of parameters and return values for operations and functions that can
 * be invoked on expressions.
 */
export type DataTypeFunc = (...args: DataType[]) => DataType;

/**
 * Tuple that defines to what data types (specified as a first element) the given function
 * (specified as a seconf element) can apply - that is, can be invoked on as a method.
 */
export type DataTypeMethod = [DataType, DataTypeFunc]

/**
 * Represents functions and opertions that can be invoked on expression of the given data type.
 */
export interface IFunctionsAndOperations
{
    // string functions
    substr: [StringDataType, (start: "int") => StringDataType]
    match: [StringDataType, (pattern: "str") => "bool"]
    concat: [StringDataType, (...args: "str"[]) => StringDataType]

    // numeric functions
    abs: [NumericDataType, () => NumericDataType]
    pow: [NumericDataType, (exp: "int") => NumericDataType]
    minus: [NumericDataType, (...args: NumericDataType[]) => NumericDataType]
}

/**
 * Helper type that from all the methods in the IFunctionsAndOperations interface, selects only
 * those that can be applied to the given data type.
 *
 * @typeParam DT DataType for which methods should be selected
 */
export type LangMethodsOf<DT extends DataType> =
    { [N in string & keyof IFunctionsAndOperations as DT extends IFunctionsAndOperations[N][0] ? N : never]-?:
        IFunctionsAndOperations[N] extends DataTypeMethod
            ? LangTypeFunc<IFunctionsAndOperations[N][1]> : never }



/**
 * Represents an expression of the given DataType.
 *
 * @typeParam DT DataType detrmining what methods and operations can be invoked on the expression.
 */
export type Expr<DT extends DataType> =
    { [op in string & keyof LangMethodsOf<DT> as `$${op}`]-?: LangMethodsOf<DT>[op] }



export type MappedParamsTuple<T extends DataType[]> = { [i in keyof T]: LangTypeOf<T[i]> | Expr<T[i]> };

export type FuncParametersTuple<F extends (...args: DataType[]) => DataType> =
    MappedParamsTuple<Parameters<F>>;

export type LangTypeFunc<F extends (...args: DataType[]) => DataType> =
    (...args: FuncParametersTuple<F> extends any[] ?FuncParametersTuple<F> : any[]) => Expr<ReturnType<F>>



export type TermBase<K extends ExprKind, DT extends DataType> = Expr<DT> &
    {
        kind: K;
        dt: DT;
    }



export type LiteralTerm<DT extends DataType> = TermBase<"lit", DT> &
    {
        v: LangTypeOf<DT>;
    }



export type FuncTerm<FN extends string, F extends (...args: DataType[]) => DataType> =
    TermBase<"func", ReturnType<F>> &
    {
        /** Function name */
        func: FN;

        /** Function parameters */
        args: FuncParametersTuple<F>;
    }



type Term2 = FuncTerm<"foo", (s: "str", start: "int", x: "bool") => "str">;
type FirstParam2 = Term2["args"][0];
let fp2: FirstParam2;
type SecondParam2 = Term2["args"][1];
let sp2: SecondParam2;
type ThirdParam2 = Term2["args"][2];
let tp2: ThirdParam2;
let term2 = {} as Term2;
term2.$substr(1).$concat("a", "b", "c").$match("abc")

type Term3 = FuncTerm<"and", (...args: "bool"[]) => "int">;
type FirstParam3 = Term3["args"][0];
let fp3: FirstParam3;
type SecondParam3 = Term3["args"][1];
let sp3: SecondParam3;
let term3 = {} as Term3;
let res = term3.$minus(1, 2, 3).$abs();

type Term4 = FuncTerm<"and", () => "bool">;
// @ts-expect-error - no element at index 0
type FirstParam4 = Term4["args"][0];

type Term5 = FuncTerm<"and", (first: "str", ...args: "bool"[]) => "bool">;
type FirstParam5 = Term5["args"][0];
let fp5: FirstParam5;
type SecondParam5 = Term5["args"][1];
let sp5: SecondParam5;



