import { DataType, DataTypeOf, LangType, LangTypeOf } from "./BasicTypes";
import { Expression, IFunctionsAndOperations } from "./ExpressionTypes";



/**
 * Creates an expression representing a literal value. This needed to form expressions that start
 * from a literal value by invoking methods on it. For example, to represent expression `5 - 6`,
 * we can write `lit(5).minus(6)`. The data type of the expression is determined by the language
 * type of the value passed to it. It can also be narrowed down by either specifying it as a
 * template parameter (e.g. `lit<"date">("2024-03-03")`) or by passing it as a second parameter,
 * (e.g. `lit("2024-03-03", "date")`).
 * @param v Value to be wrapped.
 * @param dt Optional data type that determines what methods can be invoked on the returned
 * expression.
 * @returns Expression object of the given data type.
 */
export function lit<DT extends DataType, LT extends LangTypeOf<DT>>(v: LT, dt?: DT): Expression<DT & DataTypeOf<LT>>
{
    return createExprProxy(new LiteralExpr(v)) as unknown as Expression<DT & DataTypeOf<LT>>;
}



/**
 * Creates an expression representing a variable. Variable name can be either a simple name or a
 * name in dotted notation. Accessing properties of the returned object will produce additional
 * variable expressions by adding `.prop_name` to the previous name. Thus `varref("table").id`
 * becomes `table.id` after rendering.
 * 
 * This function is not intended to be called by developers creating queries - instead it is
 * called by the query infrastructure. It is this infrastructure that casts the returned object
 * to a proper type, so that appropriate properties and expression methods can be called on it.
 * @param v Variable name.
 * @returns Object of `unknown` type.
 */
export function createVar(name: string): unknown
{
    return createExprProxy(new VarExpr(name));
}



/**
 * Renders the given expression as its string representation.
 * @param expression Expression to render.
 * @returns String representation of the expression
 */
export function renderExpression(expression: Expression<DataType>): string
{
    // treat any Expression object as instances of the Expr class
    let expr = expression instanceof Expr ? (expression?.[symExpr] ?? expression) as Expr : undefined;
    return expr ? renderExpr(expr)[0] : "";
}



/**
 * Returns a proxy object for the given Expr-based object. The rank may be needed if the result is
 * further combined with other expressions.
 * @param arg Value to render.
 * @returns A two element tuple, where the first element is a rendered string and the second tuple
 * is the precedence rank of the rendered expression.
 */
const createExprProxy = (expr: Expr): any => new Proxy<Expr>(expr, new ExprMethodsImpl());



/**
 * Kinds of expressions:
 * - lit - wraps a literal value passed as a language-specific type with indication of the data type.
 * - var - wraps a "variable"
 * - method - method invocation representing either function or operator expression
 */
type ExprKind = "lit" | "var" | "method";



/**
 * Represent a base class for expressions. The constructor returns a Proxy to the Expr object so
 * that all method invocations (allowed by the Expression<> type) return other expressions.
 */
abstract class Expr
{
    kind: ExprKind;

    constructor(kind: ExprKind)
    {
        this.kind = kind;
    }
}



/**
 * Symbol used to extract the Expr-based objects from the Proxy implementing the Expression type.
 */
const symExpr = Symbol();

/**
 * Proxy handler for Expr-based objects.
 */
class ExprMethodsImpl implements ProxyHandler<Expr>
{
    /**
     * A trap for getting a property value.
     * @param target The original object which is being proxied.
     * @param p The name or `Symbol` of the property to get.
     * @param receiver The proxy or an object that inherits from the proxy.
     */
    get?(target: Expr, p: string | symbol, receiver: any): any
    {
        // return the Expr object itself
        if (p === symExpr)
            return target;
        else if (typeof p !== "string")
        {
            // we don't support non-string properties
            return target[p];
        }
        else if (p.startsWith("$"))
        {
            // properties with "$" are considered to be functions: we return our methodBuilder
            // function bound to the target expression and the invoked function name so that it
            // will produce a proper expression when called.
            return methodBuilder.bind(target, p.substring(1));
        }
        else if (target instanceof VarExpr)
        {
            // use dotted notation to create new VarExpr and proxy for it
            return createExprProxy(new VarExpr(target.name + "." + p));
        }
        else
            return target[p];
    }
}



/**
 * Function, which is bound to an Expr operand and a method name and accepts additional arguments
 * when invoked. It creates and returns either FuncExpr or OpExpr object depending on whether the
 * passed method name corresponds to a function or an operator.
 * @param this The Expr object this function is bound to. This is the expression on which the
 * method was invoked.
 * @param name Method name this function is bound to.
 * @param args Optional additional arguments - this is empty for unary operators and for functions
 * that accept single parameter.
 * @returns
 */
function methodBuilder(this: Expr, name: string, ...args: any[]): Expr
{
    // return a proxy, which implements all expression methods (functions and operations).
    return createExprProxy(new MethodExpr(name, this, args));
}



/**
 * Definition of operator precedence levels.
 */
const enum PrecedenceRank
{
    MAX = 0,

    INTERVAL = 20,
    BINARY = 40,
    NOT = 60,
    UNARY = 80,
    BIT_XOR = 100,
    MULTIPLICATION = 120,
    DIVISION = 120,
    ADDITION = 160,
    SUBTRACTION = 160,
    SHIFT = 200,
    BIT_AND = 220,
    BIT_OR = 240,
    COMPARISON = 260,
    BETWEEN = 280,
    CASE = 280,
    AND = 320,
    XOR = 340,
    OR = 360,
    ASSIGNMENT = 380,
}



/**
 * Renders CAST function invocation. The name passed is not the method name but rather the name of
 * the type to cast to. This also determines how to interpret parameters. Many types have an
 * optional first argument (max length or precision). CHAR has optional charset and DECIMAL has
 * two parameters for precision.
 */
function renderCAST(name: string, args: ExprOrLangType[]): string
{
    let expr = renderArg(args[0])[0];
    let firstOptionalArg = args[1] ? renderArg(args[1])[0] : undefined;
    let type = name.substring(2);

    let s = `CAST(${expr} AS ${type}`;
    if (firstOptionalArg)
        s += `(${firstOptionalArg}`;

    if (type === "CHAR")
    {
        s += ")";

        let charset = args[2] ? renderArg(args[2], true)[0] : undefined;
        if (charset)
        {
            if (charset.localeCompare("ASCII", undefined, {sensitivity: "base"}) === 0)
                s += " ASCII"
            else if (charset.localeCompare("UNICODE", undefined, {sensitivity: "base"}) === 0)
                s += " UNICODE"
            else
                s += " CHARACTER SET " + charset;
        }
    }
    else if (type === "DECIMAL")
    {
        let secondOptionalArg = args[2] ? renderArg(args[2])[0] : undefined;
        if (secondOptionalArg)
            s += `,${secondOptionalArg}`;

        s += ")"
    }
    else
    {
        s += ")";
    }

    return s + ")";
}



/**
 * Renders CAST function invocation. The name passed is not the method name but rather the name of
 * the type to cast to. This also determines how to interpret parameters. Many types have an
 * optional first argument (max length or precision). CHAR has optional charset and DECIMAL has
 * two parameters for precision.
 */
function renderCASE(name: string, args: (ExprOrLangType | ExprOrLangType[])[]): string
{
    // there must be at least two argument: the expression under CASE and first WHEN
    let count = args.length;
    if (count < 2)
        return "";

    let s = "CASE " + renderArg(args[0])[0];
    for (let i = 1; i < count; i++)
    {
        // each argument must be a tuple with a value for comparison and the result value. The
        // first tuple with the undefined value for comparison is treated as the ELSE clause
        // and the loop ends.
        let [argCompare, argResult] = args[i] as [ExprOrLangType, ExprOrLangType];
        if (argCompare)
            s += ` WHEN ${renderArg(argCompare)[0]} THEN ${argResult}`;
        else
        {
            s += ` ELSE ${argResult}`;
            break;
        }
    }

    return s + " END";
}



/** Renders IN and NOT IN operations. */
const renderIN = (sign: string, args: ExprOrLangType[]): string =>
    `${renderArg(args[0])[0]} ${sign} (${args.slice(1).map(v => renderArg(v)[0]).join(", ")})`;



/** Combines Data and language types */
type ExprOrLangType = Expr | LangType;

type MethodArgs = (ExprOrLangType | ExprOrLangType[])[];

/** Information about function call expression */
type FuncInfo =
{
    type: "f";

    /** If omitted, the name is the uppercase method name (without the leading dollar sign) */
    name?: string;

    /**
     * Function that renders a call to the function with the given names and parameters. If
     * omitted, the standard rendering algorithm is applied (that is, function name with
     * comma-separated parameters in parenthesys)
     */
    render?: (name: string, args: MethodArgs) => string;
}

/** Information about operator expression */
type OpInfo =
{
    type: "o";

    /** Operator name (sign) */
    sign: string;

    /** Operator precedence rank - the higher the weaker */
    rank: number;

    /**
     * Flag indicating that expression operands combined into another expression with the same
     * operand require grouping the smaller expression into parenthesys. By default, this is
     * false and is only needed for operators like minus and division. For example, without this
     * flag, the expression `lit(20).minus(lit(10).minus(5))` would be rendered as `20 - 10 - 5`,
     * which is incorrect. With the flag, the correct string of `20 - (10 - 5)` will be rendered.
     */
    sameOpGroup?: boolean;

    /**
     * Flag which is only relevant for unary operators, that indicates that the operator sign
     * should be placed after the operand. If omitted, the default value is `false`.
     */
    postfix?: boolean;

    /**
     * Function that renders a call to the function with the given names and parameters. If
     * omitted, the standard rendering algorithm is applied, which separates parameters by the
     * operator sign.
     */
    render?: (sign: string, args: MethodArgs) => string;
}

/** Type of information we keep about methods */
type MethodInfo = string | FuncInfo | OpInfo;

/**
 * Object containing names of methods representing allowed functions and operators mapped to
 * either:
 * - a string representing a function name to use.
 * - a FuncInfo object representing a function expression
 * - an OpInfo object representing an operator expression
 *
 * If a method doesn't appear among the keys, it means that it represent a function with the
 * same name as the method's and the standard rendering algorithm (that is, function name with
 * comma-separated parameters in parenthesys).
 */
let methods: { [K in keyof IFunctionsAndOperations]?: MethodInfo } = {
    in: {type: "o", sign: "IN", rank: PrecedenceRank.COMPARISON, render: renderIN},
    minus: {type: "o", sign: "-", rank: PrecedenceRank.SUBTRACTION, sameOpGroup: true},
    not: {type: "o", sign: "NOT", rank: PrecedenceRank.NOT},
    notIn: {type: "o", sign: "NOT IN", rank: PrecedenceRank.COMPARISON, render: renderIN},
    plus: {type: "o", sign: "+", rank: PrecedenceRank.ADDITION},
    times: {type: "o", sign: "*", rank: PrecedenceRank.MULTIPLICATION},
    case: {type: "o", sign: "CASE", rank: PrecedenceRank.COMPARISON, render: renderCASE},

    eq: {type: "o", sign: "=", rank: PrecedenceRank.COMPARISON},
    ne: {type: "o", sign: "!=", rank: PrecedenceRank.COMPARISON},
    lt: {type: "o", sign: "<", rank: PrecedenceRank.COMPARISON},
    lte: {type: "o", sign: "<=", rank: PrecedenceRank.COMPARISON},
    gt: {type: "o", sign: ">", rank: PrecedenceRank.COMPARISON},
    gte: {type: "o", sign: ">=", rank: PrecedenceRank.COMPARISON},

    toCHAR: {type: "f", render: renderCAST},
    toDATE: {type: "f", render: renderCAST},
    toDATETIME: {type: "f", render: renderCAST},
    toDECIMAL: {type: "f", render: renderCAST},
    toDOUBLE: {type: "f", render: renderCAST},
    toFLOAT: {type: "f", render: renderCAST},
    toNCHAR: {type: "f", render: renderCAST},
    toREAL: {type: "f", render: renderCAST},
    toSIGNED: {type: "f", render: renderCAST},
    toTIME: {type: "f", render: renderCAST},
    toUNSIGNED: {type: "f", render: renderCAST},
    toYEAR: {type: "f", render: renderCAST},
}



/**
 * Renders the given expression and returns a tuple with the rendered string and the expression
 * precedence rank.
 */
function renderExpr(expr: Expr): [string, PrecedenceRank]
{
    switch (expr.kind)
    {
        case "lit": return [renderLangType((expr as LiteralExpr).v), PrecedenceRank.MAX];
        case "var": return [(expr as VarExpr).name, PrecedenceRank.MAX];
        case "method": return renderMethodExpr(expr as MethodExpr);
    }
}

/**
 * Renders the given MethodExpr object and return
 */
function renderMethodExpr(expr: MethodExpr): [string, PrecedenceRank]
{
    // combine the source expression and all the arguments into a single array
    let allArgs = expr.source ? [expr.source, ...expr.args] : expr.args;

    // get information object about this method. If we don't have it, then treat this as a
    // function.
    let info = methods[expr.name] as MethodInfo;
    if (!info || typeof info === "string" || info.type === "f")
        return renderFunc(expr.name, allArgs, info);
    else
        return renderOp(info, allArgs);
}



/** Renders this expression as a function call */
function renderFunc(methodName: string, args: MethodArgs, info?: string | FuncInfo): [string, PrecedenceRank]
{
    let name = (info && (typeof info === "string" ? info : info.name)) ?? methodName.toUpperCase();
    let renderFunc = info && typeof info !== "string" ? info.render : undefined;
    let s: string;
    if (renderFunc)
        s = renderFunc(name, args);
    else
    {
        // render all arguments as comma-separated parameters of the function.
        let argString = args.map(arg => renderArg(arg)[0]).join(",");
        s = `${name}(${argString})`;
    }
    return [s, PrecedenceRank.MAX];
}

/** Renders this expression as an operator expression */
function renderOp(info: OpInfo, args: MethodArgs): [string, PrecedenceRank]
{
    let ourRank = info.rank;
    let s: string;
    if (info.render)
        s = info.render(info.sign, args);
    else
    {
        if (args.length === 1)
        {
            let [s, rank] = renderArg(args[0]);
            if (rank > PrecedenceRank.MAX)
                s = `(${s})`;

            return [info.postfix ? s + info.sign : info.sign + s, PrecedenceRank.MAX];

        }

        // render all arguments separating them with the operation.
        s = args.map((arg, index) => {
            let [s, argRank] = renderArg(arg);
            if (argRank < ourRank)
                return s;
            else if (argRank > ourRank)
                return `(${s})`;
            else if (info.sameOpGroup && index > 0)
                return `(${s})`;
            else
                return s;
        }).join(` ${info.sign} `);
    }
    
    return [s, ourRank];
}



/**
 * Renders a function/operation argument, which can be either an expression or a language type. It
 * returns a tuple containing the rendered string and the precedence rank of the rendered
 * expression. The rank will be needed if the result is further combined with other expressions.
 * @param arg Value to render.
 * @param noQuotes Flag indicating that string value should not be put in quotation marks.
 * @returns A two element tuple, where the first element is a rendered string and the second tuple
 * is the precedence rank of the rendered expression.
 */
function renderArg(arg: ExprOrLangType | ExprOrLangType[], noQuotes?: boolean): [string, PrecedenceRank]
{
    let s: string;
    if (Array.isArray(arg))
        s = arg.map(v => renderArg(v, noQuotes)[0]).join(", ");
    else if (arg instanceof Expr)
        return renderExpr(arg);
    else
        s = renderLangType(arg, noQuotes);
    
    return [s, PrecedenceRank.MAX];
}



/**
 * Renders a value of a "language" type:
 * - strings are rendered in quatation marks.
 * - null and undefined are rendered as `NULL`
 * - numbers and bigint are rendered as is.
 * - Booleans are rendered as `TRUE` and `FALSE` (upper-case)
 * @param v Value to render.
 * @param noQuotes Flag indicating that string value should not be put in quotation marks.
 * @returns Rendered string.
 */
const renderLangType = (v: LangType, noQuotes?: boolean): string =>
    typeof v === "string" ? noQuotes ? v : `"${v}"` :
    v === true ? "TRUE" :
    v === false ? "FALSE" :
    v == null ? "NULL" :
    v.toString();



/**
 * Represents an expression, which simply is a wrapper around a literal value. Objects of this type
 * are created using the `lit` function. We need this to enable invoking methods to produce
 * function calls and operator expressions that start with a literal value. For example, to
 * represent expression `5 - 6`, we can write `lit(5).minus(6)`.
 */
class LiteralExpr extends Expr
{
    v: LangType;

    constructor(v: LangType)
    {
        super("lit");
        this.v = v;
    }
}



/**
 * Represents an expression, which is a wrapper around a "variable". In our system a variable is
 * either a simple name or a name in the dotted notation. Rendering the variable expression
 * produces a string with the variable name. Initial VarExpr objects are created either through the
 * `var()` function, which creates VarExpr object and returns a proxy to it. The dotted notation
 * is created by accessing a property through a such proxies.
 */
class VarExpr extends Expr
{
    name: string;

    constructor(name: string)
    {
        super("var");
        this.name = name;
    }
}



/**
 * Represents an expression created by invoking a method on another expression called "source".
 * This class represents function and operator expressions. Both expression kinds
 * have name, source expression and optional additional parameters. If the method was invoked on
 * the global object, the source expression is not defined. Additional parameters can be either
 * expressions or regular language types.
 */
class MethodExpr extends Expr
{
    /** Method name */
    name: string;

    /**
     * Expression object on which the method was invoked. This is the first parameter to a function
     * or the left operand for a binary operation or the sole operand for a unary operation. This
     * can also be undefined in the case the method producing the expression was invoked on the
     * global object (or as a global function).
     */
    source?: Expr;

    /**
     * Function parameters or operation operands. In case there are no parameters, this will be
     * an empty array.
     */
    args: MethodArgs;

    constructor(name: string, source?: Expr, args?: any[])
    {
        super("method");
        this.name = name;

        // source can be an Expr-based object or a proxy to Expr-based object. We are getting rid of proxies.
        this.source = (source?.[symExpr] ?? source) as Expr;

        // each argument can be either an Expr-based object or a proxy to Expr-based object or a
        // language type or an array of those. We are getting rid of proxies.
        this.args = !args ? [] : removeProxies(args);
    }
}


/** Helper function to remove proxies and leave only Expr instances or language types */
function removeProxies(args: any[]): MethodArgs
{
    return args.map(arg => {
        if (arg instanceof Expr)
            return arg?.[symExpr] ?? arg;
        else if (Array.isArray(arg))
            return removeProxies(arg);
        else
            return arg as LangType;
    });
}


type EnhancedObject<T> =
    { [P in keyof T]-?: T[P] extends DataType ? Expression<T[P]> : unknown }

export function testExpressionAPI(): void
{
    type Table = {
        str: "str",
        int: "int",
        bool: "bool";
    }

    let t1 = createVar("table1") as EnhancedObject<Table>;
    let t2 = createVar("table2") as EnhancedObject<Table>;

    let expressions = [
        lit(12).$pow(2).$pow(3).$abs().$minus(4, 5),
        lit(12).$minus(4).$times(lit(10).$minus(5)),
        lit(12).$times(4).$minus(lit(10).$times(5)),
        lit(12).$times(4).$minus(10).$times(5),
        lit(12).$minus(4).$plus(lit(10).$minus(5)),
        lit(12).$minus(4).$minus(lit(10).$minus(5)),
        lit(12).$minus(4).$plus(lit(10).$minus(5)),
        lit(12).$minus(4).$minus(lit(10).$times(5)).$not(),
        lit(8).$pow(2).$minus(12, 4).$minus(lit(10).$times(5)),

        lit("a").$toCHAR(),
        lit("a").$toCHAR(undefined, "UNICODE"),
        lit("a").$toCHAR(12),
        lit("a").$toCHAR(12, "ASCII"),
        lit("a").$toCHAR(12, "latin1"),
        lit("a").$toDECIMAL(),
        lit("a").$toDECIMAL(10),
        lit("a").$toDECIMAL(10, 2),

        lit("a").$in("a", "b"),
        lit(6).$notIn(5, 6, 7),

        lit(8).$case([1, 1], [lit(2), 4], ["3", 9], [undefined, 8]),

        t1.str.$eq(t2.str),
    ];

    for (let expression of expressions)
    {
        let s = renderExpression(expression);
        console.warn(s);
    }
}



