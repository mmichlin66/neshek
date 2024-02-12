import { StructType, ScalarType, MultiLink } from "./ModelTypes"
import { StringKeys } from "./UtilTypes";



/**
 * Represents information that should be retrieved for the type indicated by the type parameter
 * `T`. This can be any type allowed in the `PropType` type, including scalars, structs, arrays
 * and single and multi links. Information is specified differently for each of these types and
 * this also depends on the value of the TAllowFilters type parameter (which can only be `true`
 * or `false`).
 *
 * - Scalar property:
 *   - If filters are not allowed, the property can only be defined as `undefined`. This simply
 *     indicates that the property should be retrieved.
 *   - If filters are allowed, the property can specify filtering options. These filters will be
 *     added to the filter (if any) on the query type up the hierarhy chain. The filters can be
 *     specified in one of the following ways:
 *     - a single value - specifies the *equal* filter.
 *     - tuple with two values - specifies the *between* filter (if allowed by the property type).
 *     - an array of filter objects.
 * - Structure property:
 *   - `undefined` - this simply indicates that the structure should be retrieved with all its
 *     scalar properties.
 *   - Array of structure property names - the properties will be retrieved with default settings.
 *   - String with comma-separated structure property names - the properties will be retrieved with
 *     default settings. Note that there is no type checking of the property names.
 *   - Object with structure property names as keys. This allows specifying options for each
 *     included property.
 *   - If filters are allowed, the property can specify:
 *     - null - to indicate the "doesn't exist" filter
 *
 * For each property the following information is specified:
 * - scalar properties: boolean that determines whether to return this property if it is null
 *   in the repository. If the property has value in the repository, it will be returned no matter
 *   whether true or false is specified. If the property is null in the repository, `false` means
 *   that the response will not contain this property at all; `true` means that the response will
 *   contain this property with the null value.
 * - Structure or Single Link: `PropSet` of the corresponding type
 * - Array or Multi Link: Query of the corresponding type, which may define filters and other
 *   parameters determining how the array elements or linked objects are returned.
 *
 * @typeParam T type whose retrieval options are specified. The type can be any allowed in the
 * `PropType` type, including scalars, structs, arrays and single and multi links.
 * @typeParam TAllowFilters flag determining whether to allow specifying filters for properties.
 * Filters are not allowed only for top-level class in the `get` operation (because the only
 * "filter" is either primary key or unique constraint). For the `query` operation, as well as
 * for multi-links on any level, filters are always allowed.
 */
export type PropSet<T, TAllowFilters extends boolean> =
    T extends ScalarType | undefined ?
        TAllowFilters extends true ? T | undefined : undefined :
    T extends Array<infer TElm> | undefined ?
        undefined | StringKeys<TElm> | Query<TElm> | string :
    T extends MultiLink<infer TClass> | undefined ?
        undefined | StringKeys<TClass> | Query<TClass> | string :
    T extends StructType | undefined ?
        undefined | StringKeys<T> |
        { [P in keyof T & string]?: PropSet<T[P], TAllowFilters> } &
        { fields?: StringKeys<T> | string } :
    never;

/**
 * Represents a query for a collection of objects of the given type, which lists filters and
 * other parameters as well as properties that should be retrieved. The object might be either
 * a multi link to a class or an array of other objects.
 *
 * @typeParam T type whose retrieval options are specified. The type can be any allowed in the
 * `PropType` type, including scalars, structs, arrays and single and multi links.
 */
export type Query<T> =
{
    filters?: string;
    sort?: string;
    limit?: number;
    props?: PropSet<T, true>;
    cursor?: string;
}



