import { DataType, DataTypeOf, LangType, LangTypeOf } from "./BasicTypes";
import { Expression } from "./ExpressionTypes";



export function renderExpr<T extends DataType>(expr: Expression<T>): string
{
    return expr["render"]();

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

        let impl = new ExprMethodsImpl();

        // instead of returning an instance of our class, the constructor returns a proxy. This
        // allows implementing all expression methods (functions and operations).
        return new Proxy<Expr>(this, impl);
    }

    abstract render(): string;
    abstract get rank(): number;
}



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
        // handle the "render" method
        if (p === "render")
            return target[p].bind(target);

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
    if (name === "$minus")
        return new MethodExpr("-", this, args);

    return new MethodExpr(name, this, args);
}



/**
 * Definition of operator precedence levels.
 */
const enum PrecedenceRank
{
    MAX = 10000,

    INTERVAL = 1000,
    BINARY = 990,
    NOT = 980,
    UNARY = 970,
    BIT_XOR = 960,
    MULTIPLICATION = 950,
    DIVISION = 950,
    ADDITION = 940,
    SUBTRACTION = 940,
    SHIFT = 930,
    BIT_AND = 920,
    BIT_OR = 910,
    COMPARISON = 900,
    BETWEEN = 890,
    CASE = 890,
    AND = 880,
    XOR = 870,
    OR = 860,
    ASSIGNMENT = 850,
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
    minus: {type: "op", sign: "-", rank: PrecedenceRank.SUBTRACTION, sameOpGroup: true},
}



/** Renders this expression as a function call */
function renderFunc(info: FuncInfo, args: (Expr | LangType)[]): string
{
    // render all arguments as comma-separated parameters of the function.
    return `${info.name}(${args.map(arg => renderArg(arg)).join(",")})`;
}

/** Renders this expression as an operator expression */
function renderOp(info: OpInfo, args: (Expr | LangType)[]): string
{
    if (args.length === 1)
    {
        let s = renderArg(args[0]);
        return info.postfix ? s + info.sign : info.sign + s;

    }
    // render all arguments separating them with the operation.
    return args.map(arg => renderArg(arg)).join(` ${this.name} `);
}



/**
 * Renders a function/operation argument, which can be either an expression or a language type.
 * @param arg Value to render.
 * @returns Rendered string.
 */
function renderArgForRank(arg: Expr | LangType, rank: PrecedenceRank): string
{
    let s = renderArg(arg);
    // let argRank: PrecedenceRank;
    // if (arg instanceof Expr)
    // {
    //     argRank = arg.kind === ""
    // }

    return s;
}

/**
 * Renders a function/operation argument, which can be either an expression or a language type.
 * @param arg Value to render.
 * @returns Rendered string.
 */
function renderArg(arg: Expr | LangType): string
{
    return arg instanceof Expr ? arg.render() : renderLangType(arg);
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
 * Represents a wrapper around a literal value
 */
class LiteralExpr extends Expr
{
    v: LangType;
    get rank(): number { return PrecedenceRank.MAX; }

    constructor(v: LangType)
    {
        super("lit");
        this.v = v;
    }

    render(): string
    {
        return renderLangType(this.v);

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

    get rank(): number { return PrecedenceRank.MAX; }

    constructor(name: string, source?: Expr, args?: (Expr | LangType)[])
    {
        super("method");
        this.name = name.startsWith("$") ? name.substring(1) : name;
        this.source = source;
        this.args = args ?? [];
    }

    render(): string
    {
        // combine the source expression and all the arguments into a single array
        let allArgs = this.source ? [this.source, ...this.args] : this.args;

        // get information object about this method. If we don't have it, then treat this as a
        // function.
        let info = methods[this.name];
        if (!info)
            return renderFunc({type: "func", name: this.name.toUpperCase()}, allArgs);
        else if (typeof info === "string")
            return renderFunc({type: "func", name: info}, allArgs);
        else if (info.type === "func")
            return renderFunc(info, allArgs);
        else
            return renderOp(info, allArgs);
    }
}

export function lit<DT extends DataType, LT extends LangTypeOf<DT>>(v: LT, dt?: DT): Expression<DT & DataTypeOf<LT>>
{
    return new LiteralExpr(v) as unknown as Expression<DT & DataTypeOf<LT>>;
}



export function testExpressionAPI(): void
{
    let e = lit(12).$pow(2).$pow(3).$abs().$minus(4, 5);
    let s = renderExpr(e);
    console.log(s);
}



