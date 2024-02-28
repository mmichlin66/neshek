/**
 * Represents an error that can be produced by repository functions.
 */
export class RepoError extends Error
{
    /** Error code - even if it is numerical it should be represented as string */
    code: string;

    /** Parameters adding meaning to the error code */
    data?: string | Record<string,any>;

    constructor(code: string, data?: string | Record<string,any>, cause?: Error)
    {
        let message = data == null
            ? code
            : typeof data === "string"
                ? `${code}: ${data}`
                : `${code}: ${JSON.stringify(data)}`

        super(message, cause ? {cause} : undefined);
        this.code = code;
        this.data = data;
    }

    static rethrow(x: unknown, data?: string | Record<string,any>): never
    {
        if (x instanceof RepoError)
            throw x;
        else if (x instanceof Error)
            RepoError.Unhandled(data, x);
        else
        {
            let actData =
                data == null ? {causedBy: x} :
                typeof data === "string" ? {data, causedBy: x} :
                {...data, causedBy: x}

            RepoError.Unhandled(actData);
        }
    }

    static Unhandled(data?: string | Record<string,any>, cause?: Error): never
        { throw new RepoError( "UNHANDLED", data, cause); }
    static ClassNotFound(className: string): never
        { throw new RepoError( "CLASS_NOT_FOUND", {className}); }
    static ClassAlreadyExists(className: string): never
        { throw new RepoError( "CLASS_ALREADY_EXISTS", {className}); }
    static PropNotFound(className: string, propName: string): never
        { throw new RepoError( "PROP_NOT_FOUND", {className, propName}); }
}



