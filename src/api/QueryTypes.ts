import {
    ScalarLangType, AModel, NameOfClass, Entity, EntityPropName, EntityMultiLink, BoolDataType,
    ModelClassName
} from "./ModelTypes"
import { EnhancedEntity, Expression } from "./ExpressionTypes";
import { StringKey, StringKeys } from "./UtilTypes";



/**
 * Represents information that should be retrieved for the type indicated by the type parameter
 * `T`. This can be any type allowed in the `PropType` type, including scalars, structs, arrays
 * and single and multi links. Information is specified differently for each of these types and
 * this also depends on the value of the `TAllowFilters` type parameter (which can only be `true`
 * or `false`).
 *
 * The **PropSet** is a hierarchical structure because for single and multi link properties it
 * allows specifying nested PropSet structures. For the `get` operation, the `T` type parameter
 * indicates the type of the `Entity` corresponding to a class from the model.
 *
 * The `TAllowFilters` type parameter determines whether the PropSet can specify filters on scalar
 * and single link properties. Filters are not allowed for top-level classes and only in the `get`
 * operation (because the only "filter" is either primary key or unique constraint). For the
 * `query` operation, as well as for multi-links on any level, filters are always allowed.
 *
 * - Scalar property:
 *   - If filters are not allowed, the property can only be defined as `undefined`. This simply
 *     indicates that the property should be retrieved.
 *   - If filters are allowed, the property can specify filtering options. These filters will be
 *     added to the filter (if any) on the query type up the hierarhy chain.
 * - Single link property:
 *   - `undefined` - indicates that only the primary key property(ies) of the the linked object
 *     should be retrieved.
 *   - "*" - indicates that all the default properties of the linked object should be retrieved.
 *   - Array of linked class's property names - the properties will be retrieved with default
 *     settings.
 *   - PropSet object with linked class property names as keys. This allows specifying options for
 *     each included property recursively. This object can include a special `"_"` (underscore)
 *     property, which can specify array of linked class's property names. Property names
 *     appearring in this array, can also appear as fields of the PropSet object. The latter
 *     allows overriding how the properties are retrieved.
 * - Multi link property:
 *   - `undefined` - indicates that only the primary key property(ies) of the the linked objects
 *     should be retrieved. This implies no filtering, no sorting and default limit on the number
 *     of linked objects retrieved.
 *   - "*" - indicates that all the default properties of the linked objects should be retrieved.
 *     This implies no filtering, no sorting and default limit on the number of linked objects
 *     retrieved.
 *   - Array of linked class property names - the properties will be retrieved with default settings.
 *     This implies no filtering, no sorting and default limit on the number of linked objects
 *     retrieved.
 *   - PropSet object with linked class property names as keys. This allows specifying options for
 *     each included property recursively. This object can include a special `"_"` (underscore)
 *     property, which can specify array of linked class's property names. Property names
 *     appearring in this array, can also appear as fields of the PropSet object. The latter
 *     allows overriding how the properties are retrieved.
 *   - {@link Query} object that specifies filtering and sorting in addition to options for each included
 *     property recursively.
 *
 * @typeParam M Model describing all available classes of objects
 * @typeParam T Type whose retrieval options are specified.
 * @typeParam TAllowFilters flag determining whether to allow specifying filters for properties.
 */
export type PropSet<M extends AModel, T, TAllowFilters extends boolean> =
    T extends ScalarLangType | undefined ? TAllowFilters extends true ? T | undefined : undefined :
    // T extends Array<infer E> | undefined ?
    //     undefined | StringKeys<E> | Query<M,E> | string :
    T extends EntityMultiLink<M, infer C> | undefined ?
        undefined | EntityPropName<M, NameOfClass<C>> | Query<M, NameOfClass<C>> :
    T extends Entity<M, infer CN> | undefined ?
        undefined | StringKey<T> | StringKeys<T> | "*" | (
            {
                [P in keyof T & string]?:
                    T[P] extends ScalarLangType | undefined
                        ? TAllowFilters extends true ? T[P] | undefined : undefined
                        : PropSet<M, T[P], TAllowFilters>
            } &
            { _?: StringKey<T> | StringKeys<T> | "*" }
         ) :
    never;

/**
 * Represents a general non-templated structure of a property set defining what properties
 * should be retrieved for an object during `get` or `query` operations.
 * @internal
 */
export type APropSet = string | string[] | Record<string, any>;



/**
 * Represents a query for a collection of objects of the given type, which lists filters and
 * other parameters as well as properties that should be retrieved. The object might be either
 * a source of a multi link or an element in an array.
 *
 * @typeParam M Model describing all available classes of objects
 * @typeParam T Type whose retrieval options are specified. This must be an entity.
 */
export type Query<M extends AModel, CN extends ModelClassName<M>> =
{
    /**
     * Represent a filter to be applied to the objects of the given type. It can be specified as
     * either the FilterBase-derived object or as a function that returns a FilterBase-derived
     * object. The function accepts an object of type `T`, which can be used to specify property
     * names that should be filtered. Note that this is not a real object from the repository - it
     * is an ethemeral object only used to produce property names in a type safe manner.
     */
    filter?: (obj: EnhancedEntity<M,CN>) => Expression<BoolDataType>;
    sort?: string;
    props?: PropSet<M, Entity<M,CN>, true>;
    limit?: number;
    cursor?: string;
}

/**
 * Represents a general non-templated structure of a query for a collection of objects.
 * @internal
 */
export type AQuery =
{
    filter?: (obj: object) => Expression<BoolDataType>;
    sort?: string;
    props?: APropSet;
    limit?: number;
    cursor?: string;
}



