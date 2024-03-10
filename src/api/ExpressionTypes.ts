import {
    BoolDataType, DataType, LangType, LangTypeOf, NonBoolDataType, NumericDataType,
    StringDataType
} from "./BasicTypes";



/**
 * Function signature expressed via DataType types (instead of language types). This is used
 * to represent data types of parameters and return values for operations and functions that can
 * be invoked on expressions.
 */
export type DataTypeFunc = (...args: (DataType | LangType | undefined)[]) => DataType;

/**
 * Tuple that defines to what data types (specified as a first element) the given function
 * (specified as a seconf element) can apply - that is, can be invoked on as a method.
 */
export type DataTypeMethod = [DataType, DataTypeFunc]

/**
 * Represents functions and operations that can be invoked on expression of the given data type.
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

    // Boolean functions
    is: [BoolDataType, (arg: "bool") => BoolDataType]
    isNot: [BoolDataType, (arg: "bool") => BoolDataType]

    // functions that work on multiple types
    between: [NonBoolDataType, (min: NonBoolDataType, max: NonBoolDataType) => BoolDataType]
    coalesce: [DataType, (...args: DataType[]) => DataType]
    in: [DataType, (...args: DataType[]) => BoolDataType]
    notIn: [DataType, (...args: DataType[]) => BoolDataType]
    isNull: [DataType, () => BoolDataType]
    isNotNull: [DataType, () => BoolDataType]

    // function converting any type to any other type
    toCHAR: [DataType, (maxLen?: "int") => "str"]
    toDECIMAL: [DataType, (precision?: "int", scale?: "int") => "dec"]
    to: [DataType, (a: "str", b: boolean, c?: "int") => "dec"]
}

/**
 * Helper type which selects from the methods of the IFunctionsAndOperations interface only
 * those that can be applied to the given data type.
 *
 * @typeParam DT DataType for which methods should be selected
 */
export type LangMethodsOf<DT extends DataType> =
{
    [N in string & keyof IFunctionsAndOperations as DT extends IFunctionsAndOperations[N][0] ? N : never]-?:
        IFunctionsAndOperations[N][1] extends DataTypeFunc ? LangTypeFunc<IFunctionsAndOperations[N][1]> :
        never
}



/**
 * Represents an expression of the given DataType. This type is "implemented" by all expression
 * term types. Its main purpose is to allow invocation of all methods allowed on the given data
 * type.
 *
 * @typeParam DT DataType detrmining what methods and operations can be invoked on the expression.
 */
export type Expr<DT extends DataType> =
    { [N in string & keyof LangMethodsOf<DT> as `$${N}`]-?: LangMethodsOf<DT>[N] }

/**
 * Helper type that converts the given tuple of DataType or LangType types to a tuple
 * where each original DataType is converted to a union of the corresponding LangType and
 * Epression. The non-DataType original types remain as is.
 *
 * **Example:**
 * ```typescript
 * // original tuple
 * ["str", boolean, "int"?]
 *
 * // resulting tuple
 * [string | Expr<"str">, boolean, (number | Expr<"int">)?]
 * ```
 *
 * @typeParam T A tuple where each element is either a DataType or a LangType or `null` or
 * `undefined`
 */
export type MappedParamsTuple<T extends (DataType | LangType | null | undefined)[]> =
    { [i in keyof T]: T[i] extends DataType | undefined
        ? LangTypeOf<T[i]> | Expr<T[i] & DataType> : T[i] };

/**
 * Helper type that converts the given function type to a tuple type with elements corresponding
 * to the function parameters. Each original DataType parameter is converted to a union of the
 * corresponding LangType and Expr types. The non-DataType original parameters remain as is.
 *
 * **Example:**
 * ```typescript
 * // function signature
 * (arg1: "str", arg2: boolean, arg3: "int"?) => "str"
 *
 * // resulting tuple
 * [string | Expr<"str">, boolean, (number | Expr<"int">)?]
 * ```
 *
 * @typeParam T A function where each parameter is either a DataType or a LangType or `null` or
 * `undefined`.
 */
export type DataTypeFuncParams<F extends DataTypeFunc> = MappedParamsTuple<Parameters<F>>;

/**
 * Helper type that converts the given function type expressed in terms of data types (that is,
 * DataType) to a function type expressed in terms of corresponding language and expression types.
 * Each original DataType parameter is converted to a union of the corresponding LangType and Expr
 * types. The non-DataType original parameters remain as is. The function return value is converted
 * to a corresponding Expr type.
 *
 * **Example:**
 * ```typescript
 * // DataType function signature
 * (arg1: "str", arg2: boolean, arg3: "int"?) => "str"
 *
 * // resulting function signature
 * (arg1: string | Expr<"str">, arg2: boolean, arg3: (number | Expr<"int">)?) => Expr<"str">
 * ```
 *
 * @typeParam T A function where each parameter is either a DataType or a LangType or `null` or
 * `undefined`.
 */
export type LangTypeFunc<F extends DataTypeFunc> =
    (...args: DataTypeFuncParams<F> extends any[] ? DataTypeFuncParams<F> : any[]) => Expr<ReturnType<F>>



/**
 * Kinds of expressions:
 * - lit - wraps a literal value passed as a language-specific type with indication of the data type.
 * - var - wraps a "variable"
 * - func - function invocation
 * - op - arithmetic or logical operation. They are very similar to function invocation; however
 *   operations have different precedence rules.
 */
export type ExprKind = "lit" | "var" | "func" | "op";



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
        args: DataTypeFuncParams<F>;
    }



