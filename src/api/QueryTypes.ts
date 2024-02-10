import { StructType, ScalarOrUndefined, ArrayOrUndefined, StructOrUndefined } from "./SchemaTypes"



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
export type PropSet<T> = T extends StructType
    ? { [P in keyof T]?: T[P] extends ScalarOrUndefined ? boolean :
            T[P] extends ArrayOrUndefined<infer TElm> ? Query<TElm> :
            T[P] extends StructOrUndefined ? PropSet<T[P]> : never }
    : never;

/**
 * Represents a query for a collection of objects of the given class, which lists filters and
 * other parameters as well as properties that should be retrieved.
 */
export type Query<T> =
{
    props?: PropSet<T>;
    limit?: number;
    cursor?: string;
}



