import { ScalarType, MultiLink, AModel, NameOfClass, Entity, EntityPropName } from "./ModelTypes"
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
    // T extends Array<infer E> | undefined ?
    //     undefined | StringKeys<E> | Query<M,E> | string :
    T extends MultiLink<infer C> | undefined ?
        undefined | EntityPropName<M, NameOfClass<C>> | Query<M, Entity<M, NameOfClass<C>>> :
    T extends Entity<M, infer CN> | undefined ?
        undefined | StringKey<T> | StringKeys<T> | "*" | (
            {
                [P in keyof T & string]?:
                    T[P] extends ScalarType | undefined
                        ? TAllowFilters extends true ? T[P] | undefined : undefined
                        : PropSet<M, T[P], TAllowFilters>
            } &
            { _?: StringKey<T> | StringKeys<T> | "*" }
         ) :
    never;

/**
 * Represents a general non-templated structure of a property set defining what properties
 * should be retrieved for an object during `get` or `query` operations.
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
export type Query<M extends AModel, E extends Entity<M,string>> =
{
    /**
     * Represent a filter to be applied to the objects of the given type. It can be specified as
     * either the FilterBase-derived object or as a function that returns a FilterBase-derived
     * object. The function accepts an object of type `T`, which can be used to specify property
     * names that should be filtered. Note that this is not a real object from the repository - it
     * is an ethemeral object only used to produce property names in a type safe manner.
     */
    filter?: (obj: EnhancedEntity<M,E>) => AFilterBase;
    sort?: string;
    props?: PropSet<M, E, true>;
    limit?: number;
    cursor?: string;
}

/**
 * Represents a general non-templated structure of a query for a collection of objects.
 */
export type AQuery =
{
    filter?: (obj: object) => AFilterBase;
    sort?: string;
    props?: APropSet;
    limit?: number;
    cursor?: string;
}



/**
 * Represent a base type from which all filters derive. It defines the filtering operation and an
 * optional "enhanced" property. Filters can be applied to either an entity or to a specific
 * property. In the latter case, the filter doesn't need to define the property because the
 * property the filter works on is determined based on the property it is applied to. In the former
 * case, that is, when a filter is applied to an entity, the filter itself defines the property, to
 * which it applies.
 */
export type FilterBase<O extends string> =
{
    /**
     * Filtering operation. Each derived filter type restricts this string type to a pre-defined
     * set of known values.
     */
    op: O;

    /**
     * Optional property specification represented as an array of property names following a path
     * starting from the entity class being filtered.
     */
    propPath?: string[];
}

/**
 * Represents a general non-templated structure of a base filter object.
 */
export type AFilterBase = FilterBase<string>;

export type NoArgFilter<O extends string> = FilterBase<O>

export type OneArgFilter<O extends string, T extends ScalarType> = FilterBase<O> &
{
    /** Single argument */
    arg: T;
}

export type TwoArgFilter<O extends string, T extends ScalarType> = FilterBase<O> &
{
    /** First argument */
    arg1: T;

    /** Second argument */
    arg2: T;
}



/**
 * Represents an object based on the given entity type, whose properties can participate in
 * filtering operations on objects of the given type. Every property of this "enhanced" type
 * contains type-appropriate filtering functions.
 *
 * **Example:**
 * ```typescript
 * // The following query retrieves all items sold for less then the products' MSRPs
 * // The `item` parameter in the following lambda function is of type `FilteredEntity<M,"Item">
 * query("Item", {filter: item => item.price.lt(item.product.msrp)});
 * ```
 */
export type EnhancedEntity<M extends AModel, E extends Entity<M,string>> =
    { [P in keyof E]-?: EnhancedProp<M, E[P]>}

export type EnhancedProp<M extends AModel, T> =
    T extends string ? EnhancedStringProp :
    T extends number ? EnhancedNumberProp :
    T extends Entity<M, infer CN> ? EnhancedLinkProp<M,T> :
    never



export type Expression<T> =
    T extends string ? string | EnhancedStringProp :
    T extends number ? number | EnhancedNumberProp :
    never



export interface StringFilterOperations
{
    [P: string]: (...args: any[]) => AFilterBase;

    isNull: () => AFilterBase
    isDefined: () => AFilterBase

    eq: (arg: Expression<string>) => AFilterBase;
    ne: (arg: Expression<string>) => AFilterBase;
    lt: (arg: Expression<string>) => AFilterBase;
    gt: (arg: Expression<string>) => AFilterBase;
    lte: (arg: Expression<string>) => AFilterBase;
    gte: (arg: Expression<string>) => AFilterBase;

    like: (arg: Expression<string>) => AFilterBase;
    match: (arg: Expression<string> | RegExp) => AFilterBase;

    between: (arg1: Expression<string>, arg2: Expression<string>) => AFilterBase;
}



export interface NumberFilterOperations
{
    [P: string]: (...args: any[]) => AFilterBase;

    isNull: () => AFilterBase
    isDefined: () => AFilterBase

    eq: (arg: Expression<number>) => AFilterBase;
    ne: (arg: Expression<number>) => AFilterBase;
    lt: (arg: Expression<number>) => AFilterBase;
    gt: (arg: Expression<number>) => AFilterBase;
    lte: (arg: Expression<number>) => AFilterBase;
    gte: (arg: Expression<number>) => AFilterBase;

    between: (arg1: Expression<number>, arg2: Expression<number>) => AFilterBase;
}



/**
 * Represents a string property "enhanced" with string-appropriate filtering operations
 */
export type EnhancedStringProp =
{
    [op in keyof StringFilterOperations as `$${op}`]-?: StringFilterOperations[op]
}



/**
 * Represents a number property "enhanced" with number-appropriate filtering operations
 */
export type EnhancedNumberProp =
{
    [op in keyof NumberFilterOperations as `$${op}`]-?: NumberFilterOperations[op]
}



/**
 * Represents a string property "enhanced" with single link-appropriate filtering operations.
 * This allows checking for `null` values and enhances every property of the linked object with
 * the type-appropriate filtering functions.
 */
export type EnhancedLinkProp<M extends AModel, E extends Entity<M,string>> =
    { [P in keyof E & string]: EnhancedProp<M, E[P]> } &
    {
        $isNull: () => NullFilter
        $isDefined: () => NullFilter
    }



export type Filter<M extends AModel, T> =
    T extends string ? StringFilter :
    // T extends number ? NumberFilter :
    T extends boolean ? BoolFilter :
    // T extends bigint ? BigIntFilter :
    // T extends Entity<M, infer CN> ? LinkFilter<M,T> | (
    //     { [P in keyof T & string]: Filter<M, T[P]> }
    // ) :
    never



/**
 * Filter that checks for existance or non-existance of real value as opposed to `null` value.
 * This filter can be assigned to a nullable property of any type.
 */
export type NullFilter = NoArgFilter<"null" | "defined">;

/**
 * Standard comparison operations. Note that the `"neq"` operation will return `true` for `null`
 * values. Note also that you cannot use the `"eq"` or `"ne"` operations to compare to `null`;
 * instead use the `"null"` and `"defined"` operations.
 */
export type ComparisonFilterOp = "eq" | "ne" | "lt" | "lte" | "gt" | "gte";

export type BetweenFilterOp = "between";



export type StringOneArgFilterOp = ComparisonFilterOp | "like" | "unlike" | "match" | "nomatch";

export type StringTwoArgFilterOp = BetweenFilterOp;

export type StringFilter =
    NullFilter |
    OneArgFilter<StringOneArgFilterOp, string> |
    TwoArgFilter<StringTwoArgFilterOp, string>;



export type NumberOneArgFilterOp = ComparisonFilterOp;

export type NumberTwoArgFilterOp = BetweenFilterOp;

export type NumberFilter =
    NullFilter |
    OneArgFilter<NumberOneArgFilterOp, number> |
    TwoArgFilter<NumberTwoArgFilterOp, number>;



export type BoolFilter = NullFilter | OneArgFilter<"eq" | "ne", boolean>;



