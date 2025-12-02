import {
    AClass, AModel, BoolDataType, Class, DataOrLangType, DataType, IntegerDataType, LangType, LangTypeOf,
    ModelClassName, ModelClassPropName, ModelClassProps, MultiLink, NonBoolDataType, NumericDataType,
    RealDataType, ScalarDataType, StringDataType
} from "./ModelTypes";



/**
 * Function signature expressed via DataType types (instead of language types). This is used
 * to represent data types of parameters and return values for operations and functions that can
 * be invoked on expressions.
 */
export type DataTypeFunc = (...args: (DataOrLangType | DataOrLangType[])[]) => DataType;

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
    substr: [StringDataType, (start: IntegerDataType) => StringDataType]
    like: [StringDataType, (pattern: "str") => "bool"]
    match: [StringDataType, (pattern: "str") => "bool"]
    concat: [StringDataType, (...args: "str"[]) => StringDataType]

    // numeric functions
    abs: [NumericDataType, () => NumericDataType]
    pow: [NumericDataType, (exp: IntegerDataType | RealDataType) => NumericDataType]
    minus: [NumericDataType, (...args: NumericDataType[]) => NumericDataType]
    plus: [NumericDataType, (...args: NumericDataType[]) => NumericDataType]
    times: [NumericDataType, (...args: NumericDataType[]) => NumericDataType]

    // Boolean functions
    is: [BoolDataType, (arg: "bool") => BoolDataType]
    isNot: [BoolDataType, (arg: "bool") => BoolDataType]

    // General comparison functions
    eq: [DataType, (arg: DataType) => BoolDataType]
    ne: [DataType, (arg: DataType) => BoolDataType]
    lt: [ScalarDataType, (arg: ScalarDataType) => BoolDataType]
    lte: [ScalarDataType, (arg: ScalarDataType) => BoolDataType]
    gt: [ScalarDataType, (arg: ScalarDataType) => BoolDataType]
    gte: [ScalarDataType, (arg: ScalarDataType) => BoolDataType]

    // functions that work on multiple types
    between: [NonBoolDataType, (min: NonBoolDataType, max: NonBoolDataType) => BoolDataType]
    coalesce: [ScalarDataType, (...args: ScalarDataType[]) => ScalarDataType]
    in: [ScalarDataType, (...args: ScalarDataType[]) => BoolDataType]
    notIn: [ScalarDataType, (...args: ScalarDataType[]) => BoolDataType]
    isNull: [DataType, () => BoolDataType]
    isNotNull: [DataType, () => BoolDataType]
    not: [BoolDataType | NumericDataType, () => BoolDataType]

    // function converting one type to another other type
    toCHAR: [ScalarDataType, (maxLen?: IntegerDataType, charset?: "str") => "str"]
    toDATE: [ScalarDataType, () => "date"]
    toDATETIME: [ScalarDataType, (precision?: IntegerDataType) => "datetime"]
    toDECIMAL: [ScalarDataType, (precision?: IntegerDataType, scale?: IntegerDataType) => "dec"]
    toDOUBLE: [ScalarDataType, () => "real"]
    toFLOAT: [ScalarDataType, (precision?: IntegerDataType) => "real"]
    toNCHAR: [ScalarDataType, (maxLen?: IntegerDataType) => "str"]
    toREAL: [ScalarDataType, () => "real"]
    toSIGNED: [ScalarDataType, () => "bigint"]
    toTIME: [ScalarDataType, (precision?: IntegerDataType) => "time"]
    toUNSIGNED: [ScalarDataType, () => "bigint"]
    toYEAR: [ScalarDataType, (precision?: IntegerDataType) => "year"]

    case: [ScalarDataType, (...args: [when: ScalarDataType | undefined, result: ScalarDataType][]) => ScalarDataType]
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
export type Expression<DT extends DataType> =
    DT extends "any"
        ? { [N: string]: (...args: any[]) => any }
        : { [N in string & keyof LangMethodsOf<DT> as `$${N}`]-?: LangMethodsOf<DT>[N] }

/**
 * Helper type that converts the given tuple of DataType or LangType types to a tuple
 * where each original DataType is converted to a union of the corresponding LangType and
 * Epression. The non-DataType original types remain as is.
 *
 * **Example:**
 * ```typescript
 * // original tuple
 * ["str", boolean, "i4"?]
 *
 * // resulting tuple
 * [string | Expr<"str">, boolean, (number | Expr<"i4">)?]
 * ```
 *
 * @typeParam T A tuple where each element is either a DataType or a LangType or an array of
 * these types.
 */
export type MappedParamsTuple<T extends (DataOrLangType | DataOrLangType[])[]> =
{
    [i in keyof T]:
        T[i] extends DataType | undefined ? LangTypeOf<T[i]> | Expression<T[i] & DataType> :
        T[i] extends Array<DataType | LangType> ? MappedParamsTuple<T[i]> :
        T[i]
};

/**
 * Helper type that converts the given function type to a tuple type with elements corresponding
 * to the function parameters. Each original DataType parameter is converted to a union of the
 * corresponding LangType and Expr types. The non-DataType original parameters remain as is.
 *
 * **Example:**
 * ```typescript
 * // function signature
 * (arg1: "str", arg2: boolean, arg3: "i4"?) => "str"
 *
 * // resulting tuple
 * [string | Expr<"str">, boolean, (number | Expr<"i4">)?]
 * ```
 *
 * @typeParam T A function where each parameter is either a DataType or a LangType or an array of
 * these types.
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
 * (arg1: "str", arg2: boolean, arg3: "i4"?) => "str"
 *
 * // resulting function signature
 * (arg1: string | Expr<"str">, arg2: boolean, arg3: (number | Expr<"i4">)?) => Expr<"str">
 * ```
 *
 * @typeParam T A function where each parameter is either a DataType or a LangType or an array of
 * these types.
 */
export type LangTypeFunc<F extends DataTypeFunc> =
    (...args: DataTypeFuncParams<F> extends any[] ? DataTypeFuncParams<F> : any[]) => Expression<ReturnType<F>>



/**
 * Represents an object based on the given entity type, whose properties can participate in
 * filtering operations on objects of the given type. Every property of this "enhanced" type
 * contains type-appropriate filtering functions.
 *
 * **Example:**
 * ```typescript
 * // The following query retrieves all items sold for less then the products' MSRPs
 * // The `item` parameter in the following lambda function is of type `EnhancedEntity<M,"Item">
 * query("Item", {filter: item => item.price.lt(item.product.msrp)});
 * ```
 */
export type EnhancedEntity<M extends AModel, CN extends ModelClassName<M>> =
    { [P in ModelClassPropName<M,CN>]-?: EnhancedProp<M, ModelClassProps<M,CN>[P]>}

export type EnhancedProp<M extends AModel, T> =
    T extends ScalarDataType ? Expression<T> :
    T extends MultiLink<AClass> ? never :
    T extends Class<infer CN, any, any> ? EnhancedEntity<M,CN> & {
        $isNull: () => Expression<BoolDataType>;
        $isNotNull: () => Expression<BoolDataType>;
    } :
    never



