import { DataType, DataTypeOf, LangType, LangTypeOf } from "./BasicTypes";
import { Expression } from "./ExpressionTypes";



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
    return new Proxy<Expr>(new LiteralExpr(v), new ExprMethodsImpl()) as unknown as Expression<DT & DataTypeOf<LT>>;
}



/**
 * Renders the given expression as its string representation.
 * @param expression Expression to render.
 * @returns String representation of the expression
 */
export function renderExpression<T extends DataType>(expression: Expression<T>): string
{
    // treat any Expression object as instances of the Expr class
    return renderExpr((expression?.[symExpr] ?? expression) as Expr)[0];
}



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

        // other properties are considered to be functions: we return our methodBuilder function
        // bound to the target expression and the invoked function name so that it will produce a
        // proper expression when called.
        return methodBuilder.bind(target, p);
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
function methodBuilder(this: Expr, name: string, ...args: (Expr | LangType)[]): Expr
{
    // return new MethodExpr(name, this, args);

    // return a proxy, which implements all expression methods (functions and operations).
    return new Proxy<Expr>(new MethodExpr(name, this, args), new ExprMethodsImpl());
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
    CASE = 300,
    AND = 320,
    XOR = 340,
    OR = 360,
    ASSIGNMENT = 380,
}



/** Information about function call expression */
type FuncInfo =
{
    type: "func";

    /** If omitted, the name is the method name (without the leading dollar sign) */
    name?: string;

    /**
     * Function that renders a call to the function with the given names and parameters. If
     * omitted, the standard rendering algorithm is applied (that is, function name with
     * comma-separated parameters in parenthesys)
     */
    render?: (name: string, args: (Expr | LangType)[]) => string;
}

/** Information about operator expression */
type OpInfo =
{
    type: "op";

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
}

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
let methods: { [K: string]: string | FuncInfo | OpInfo } = {
    times: {type: "op", sign: "*", rank: PrecedenceRank.MULTIPLICATION},
    plus: {type: "op", sign: "+", rank: PrecedenceRank.ADDITION},
    minus: {type: "op", sign: "-", rank: PrecedenceRank.SUBTRACTION, sameOpGroup: true},
}



/**
 * Renders the given expression.
 */
function renderExpr(expr: Expr): [string, PrecedenceRank]
{
    // we assume that any expression passed to this function is a proxy to an Expr-based object
    // let expr = (expression[symExpr] ?? expression) as Expr;
    switch (expr.kind)
    {
        case "lit": return [renderLangType((expr as LiteralExpr).v), PrecedenceRank.MAX];
        case "method": return renderMethodExpr(expr as MethodExpr);
        case "var": return ["", PrecedenceRank.MAX];
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
    let info = methods[expr.name];
    if (!info)
        return renderFunc({type: "func", name: expr.name.toUpperCase()}, allArgs);
    else if (typeof info === "string")
        return renderFunc({type: "func", name: info}, allArgs);
    else if (info.type === "func")
        return renderFunc(info, allArgs);
    else
        return renderOp(info, allArgs);
}



/** Renders this expression as a function call */
function renderFunc(info: FuncInfo, args: (Expr | LangType)[]): [string, PrecedenceRank]
{
    // render all arguments as comma-separated parameters of the function.
    let argString = args.map(arg => renderArg(arg)[0]).join(",");
    return [`${info.name}(${argString})`, PrecedenceRank.MAX];
}

/** Renders this expression as an operator expression */
function renderOp(info: OpInfo, args: (Expr | LangType)[]): [string, PrecedenceRank]
{
    if (args.length === 1)
    {
        let [s, rank] = renderArg(args[0]);
        if (rank > PrecedenceRank.MAX)
            s = `(${s})`;

        return [info.postfix ? s + info.sign : info.sign + s, PrecedenceRank.MAX];

    }

    // render all arguments separating them with the operation.
    let ourRank = info.rank;
    return [args.map((arg, index) => {
        let [s, argRank] = renderArg(arg);
        if (argRank < ourRank)
            return s;
        else if (argRank > ourRank)
            return `(${s})`;
        else if (info.sameOpGroup && index > 0)
            return `(${s})`;
        else
            return s;
    }).join(` ${info.sign} `), ourRank];
}



/**
 * Renders a function/operation argument, which can be either an expression or a language type. It
 * returns a tuple containing the rendered string and the precedence rank of the rendered
 * expression. The rank will be needed if the result is further combined with other expressions.
 * @param arg Value to render.
 * @returns A two element tuple, where the first element is a rendered string and the second tuple
 * is the precedence rank of the rendered expression.
 */
function renderArg(arg: Expr | LangType): [string, PrecedenceRank]
{
    return arg instanceof Expr ? renderExpr(arg) : [renderLangType(arg), PrecedenceRank.MAX];
}



/**
 * Renders a value of a "language" type:
 * - strings are rendered in quatation marks.
 * - null and undefined are rendered as `NULL`
 * - numbers and bigint are rendered as is.
 * - Booleans are rendered as `TRUE` and `FALSE` (upper-case)
 * @param v Value to render.
 * @returns Rendered string.
 */
const renderLangType = (v: LangType): string =>
    typeof v === "string" ? `"${v}"` :
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
    args: (Expr | LangType)[];

    constructor(name: string, source?: Expr | Expression<any>, args?: ( Expr | Expression<any> | LangType)[])
    {
        super("method");
        this.name = name.startsWith("$") ? name.substring(1) : name;

        // source can be an Expr-based object or a proxy to Expr-based object.
        this.source = (source?.[symExpr] ?? source) as Expr;

        // each argument can be either an Expr-based object or a proxy to Expr-based object or a
        // language type
        this.args = !args ? [] : args.map(arg =>
            arg instanceof Expr ? (arg?.[symExpr] ?? arg) as Expr : arg as LangType);
    }
}



export function testExpressionAPI(): void
{
    let s = renderExpression(lit(12).$pow(2).$pow(3).$abs().$minus(4, 5));
    console.log(s);

    s = renderExpression(lit(12).$minus(4).$times(lit(10).$minus(5)));
    console.log(s);

    s = renderExpression(lit(12).$times(4).$minus(lit(10).$times(5)));
    console.log(s);

    s = renderExpression(lit(12).$times(4).$minus(10).$times(5));
    console.log(s);

    s = renderExpression(lit(12).$minus(4).$plus(lit(10).$minus(5)));
    console.log(s);

    s = renderExpression(lit(12).$minus(4).$minus(lit(10).$minus(5)));
    console.log(s);

    s = renderExpression(lit(12).$minus(4).$minus(lit(10).$times(5)));
    console.log(s);

    s = renderExpression(lit(8).$pow(2).$minus(12, 4).$minus(lit(10).$times(5)));
    console.log(s);
}



