import { DataType, DataTypeOf, LangType, LangTypeOf } from "./BasicTypes";
import { Expression } from "./ExpressionTypes";



export function renderExpr<T extends DataType>(expr: Expression<T>): string
{
    return expr["render"].call(expr);

}



/**
 * Kinds of expressions:
 * - lit - wraps a literal value passed as a language-specific type with indication of the data type.
 * - var - wraps a "variable"
 * - func - function invocation
 * - op - arithmetic or logical operation. They are very similar to function invocation; however,
 *   operations have precedence rules.
 */
type ExprKind = "lit" | "var" | "func" | "op";



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
    return new FuncExpr(name, this, args);
}



/**
 * Represents a wrapper around a literal value
 */
class LiteralExpr extends Expr
{
    v: LangType;

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
 * Represents a function invocation with at least one parameter, which is the object on which the
 * method was invoked. Can have arbitrary number of additional parameters, which can be either
 * expressions or regular language types.
 */
class FuncExpr extends Expr
{
    /** Function name */
    name: string;

    /**
     * Expression object on which the method was invoked. This is the first parameter to a function
     * or the left operand for a binary operation or the sole operand for an unary operation.
     */
    source: Expr;

    /** Function parameters */
    args: (Expr | LangType)[];

    constructor(name: string, source: Expr, args: (Expr | LangType)[])
    {
        super("func");
        this.name = name;
        this.source = source;
        this.args = args;
    }

    render(): string
    {
        // combine the source expression and all the arguments into a single array so that we can
        // render them as comma-separated parameters of the function.
        let allArgs = [this.source, ...this.args];
        return `${this.name}(${allArgs.map(arg => renderArg(arg)).join(",")})`;
    }
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
    v == null ? "NULL" :
    v === true ? "TRUE" :
    v === false ? "FALSE" :
    v.toString();



/**
 * Renders a function/operation argument, which can be either an expression or of a language type.
 * @param v Value to render.
 * @returns Rendered string.
 */
const renderArg = (v: Expr | LangType): string => v instanceof Expr ? v.render() : renderLangType(v);



export function lit<DT extends DataType, LT extends LangTypeOf<DT>>(v: LT, dt?: DT): Expression<DT & DataTypeOf<LT>>
{
    return new LiteralExpr(v) as unknown as Expression<DT & DataTypeOf<LT>>;
}

export function testExpressionAPI(): void
{
    let e = lit(12).$pow(2).$pow(3).$abs();
    let s = renderExpr(e);
    console.log(s);
}



