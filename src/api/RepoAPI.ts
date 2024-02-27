import { IRepoError } from "./RepoTypes";



/** Represents an error that can be produced by repository functions. */
export class RepoError extends Error implements IRepoError
{
    /** Error code - even if it is numerical it should be represented as string */
    code: string;

    /** Parameters adding value to the error code */
    data?: string | Record<string,any>;

    constructor(code: string, data?: string | Record<string,any>, cause?: Error)
    {
        let message = data == null
            ? code
            : typeof data === "string"
                ? `${code}; ${data}`
                : `${code}; ${JSON.stringify(data)}`

        super(message, cause ? {cause} : undefined);
        this.code = code;
        this.data = data;
    }

    static rethrow(x: any, source: string): never
    {
        if (x instanceof RepoError)
            throw x;
        else if (x instanceof Error)
            RepoError.Unhandled({source}, x);
        else
            RepoError.Unhandled({source, causedBy: x});
    }

    static Unhandled(data: string | Record<string,any>, cause?: Error): never
        { throw new RepoError( "UNHANDLED", data, cause); }
    static ClassNotFound(className: string): never
        { throw new RepoError( "CLASS_NOT_FOUND", {className}); }
    static ClassAlreadyExists(className: string): never
        { throw new RepoError( "CLASS_ALREADY_EXISTS", {className}); }
    static PropNotFound(className: string, propName: string): never
        { throw new RepoError( "PROP_NOT_FOUND", {className, propName}); }
}



