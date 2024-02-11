import { StructType, ScalarOrUndefined, StructOrUndefined, MultiLink } from "./ModelTypes"
import { ArrayOrUndefined } from "./UtilTypes";



/**
 * Represents a set of properties that should be retrieved. The set is hierarchical and starts with
 * the properties of the given class. For each property the following information is specified:
 * - scalar properties: boolean that determines whether to return this property if it is null
 *   in the repository. If the property has value in the repository, it will be returned no matter
 *   whether true or false is specified. If the property is null in the repository, `false` means
 *   that the response will not contain this property at all; `true` means that the response will
 *   contain this property with the null value.
 * - Structure or Single Link: `PropSet` of the corresponding type
 * - Array or Multi Link: Query of the corresponding type, which may define filters and other
 *   parameters determining how the array elements or linked objects are returned.
 */
export type PropSet<T, TAllowFilters extends boolean> = T extends StructType
    ? { [P in keyof T & string]?:
        T[P] extends ScalarOrUndefined
            ? TAllowFilters extends true ? T[P] | undefined
            : undefined :
        T[P] extends ArrayOrUndefined<infer TElm> ? Query<TElm> :
        T[P] extends MultiLink<infer TClass> | undefined ? Query<TClass> :
        T[P] extends StructOrUndefined ? PropSet<T[P], TAllowFilters> : never }
    : never;

/**
 * Represents a set of properties that should be retrieved. The set is hierarchical and starts with
 * the properties of the given class. For each property the following information is specified:
 * - scalar properties: boolean that determines whether to return this property if it is null
 *   in the repository. If the property has value in the repository, it will be returned no matter
 *   whether true or false is specified. If the property is null in the repository, `false` means
 *   that the response will not contain this property at all; `true` means that the response will
 *   contain this property with the null value.
 * - Structure or Single Link: `PropSet` of the corresponding type
 * - Array or Multi Link: Query of the corresponding type, which may define filters and other
 *   parameters determining how the array elements or linked objects are returned.
 */
export type GetPropSet<T> = PropSet<T, false>;

/**
 * Represents a set of properties that should be retrieved. The set is hierarchical and starts with
 * the properties of the given class. For each property the following information is specified:
 * - scalar properties: boolean that determines whether to return this property if it is null
 *   in the repository. If the property has value in the repository, it will be returned no matter
 *   whether true or false is specified. If the property is null in the repository, `false` means
 *   that the response will not contain this property at all; `true` means that the response will
 *   contain this property with the null value.
 * - Structure or Single Link: `PropSet` of the corresponding type
 * - Array or Multi Link: Query of the corresponding type, which may define filters and other
 *   parameters determining how the array elements or linked objects are returned.
 */
export type QueryPropSet<T> = PropSet<T, true>;

/**
 * Represents a query for a collection of objects of the given class, which lists filters and
 * other parameters as well as properties that should be retrieved.
 */
export type Query<T> =
{
    filters?: string;
    sort?: string;
    limit?: number;
    props?: QueryPropSet<T>;
    cursor?: string;
}



