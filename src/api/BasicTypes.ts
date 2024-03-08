import {
    PropType, MultiLink, ModelClassName, Class, AModel, AClass
} from "./ModelTypes";



/**
 * Represents underlying data types corresponding to property types:
 * - string properties:
 *   - "str" - string
 *   - "clob" - character-based large object
 *   - "date" - date only
 *   - "time" - time only
 *   - "datetime" - datetime
 *   - "timestamp" - timestamp
 * - numeric properties
 *   - "int" - signed or unsigned integer of different sizes
 *   - "real" - floating-point numbers of single or double precision
 *   - "dec" - fixed-point numbers (DECIMAL/NUMERIC)
 *   - "bit" - bit-values
 *   - "timestamp" - timestamp
 * - bigint properties
 *   - "bigint" - signed or unsigned integer of different sizes
 *   - "dec" - fixed-point numbers (DECIMAL/NUMERIC)
 *   - "bit" - bit-values
 *   - "timestamp" - timestamp
 * - boolean properties
 *   - "bool" - boolean
 * - Special properties
 *   - "link" - single link
 *   - "multilink" - multi-link
 *   - "obj" - structured object
 *   - "arr" - array
 */
export type DataType =
    "str" | "clob" |
    "bool" |
    "int" | "bigint" | "real" | "dec" | "bits" |
    "date" | "time" | "datetime" | "timestamp" |
    "link" | "multilink" |
    "obj" | "arr";



/**
 * Represents underlying data type corresponding to the given property type
 */
export type DataTypeOfPropType<M extends AModel, T extends PropType> =
    T extends string ? "str" | "date" | "time" | "datetime" | "timestamp" :
    T extends number ? "int" | "real" | "dec" | "bit" | "ts" :
    T extends bigint ? "bigint" | "dec" | "bit" | "ts" :
    T extends boolean ? "bool" :
    // T extends Date ? "timestamp" :
    T extends MultiLink<AClass> ? "multilink" :
    T extends Class<infer CN,any,any> ? CN extends ModelClassName<M>
        ? "link"
        : never :
    never

