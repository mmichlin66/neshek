/**
 * Represents language-specific scalar types used to work with class properties.
 */
export type LangType = string | number| bigint | boolean ;



/**
 * Represents data types corresponding to string property types:
 *   - "str" - string
 *   - "clob" - character-based large object
 */
export type StringDataType = "str" | "clob";

/**
 * Represents data types corresponding to temporal property types:
 *   - "date" - date only
 *   - "time" - time only
 *   - "datetime" - datetime
 *   - "timestamp" - timestamp
 */
export type TemporalDataType = "date" | "time" | "datetime" | "timestamp";

/**
 * Represents underlying data types corresponding to integer property types:
 *   - "int" - signed or unsigned integer of different sizes
 *   - "bigint" - signed or unsigned integer of different sizes
 *   - "bit" - bit-values
 *   - "year" - 4-digit year
 */
export type IntegerDataType = "int" | "bigint" | "bit" | "year";

/**
 * Represents underlying data types corresponding to real (floating or fixed point) property types:
 *   - "real" - floating-point numbers of single or double precision
 *   - "dec" - fixed-point numbers (DECIMAL/NUMERIC)
 */
export type RealDataType = "real" | "dec"

/**
 * Represents underlying data types corresponding to big integer property types:
 *   - "bigint" - signed or unsigned integer of different sizes
 *   - "bit" - bit-values
 */
export type BigintDataType = "bigint" | "bit";

/**
 * Combines integer and real data types in one definition for convenience
 */
export type NumericDataType = IntegerDataType | RealDataType

/**
 * Represents underlying data types corresponding to Boolean property types:
 *   - "bool" - boolean
 */
export type BoolDataType ="bool";

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
 *   - "year" - 4-digit year
 * - bigint properties
 *   - "bigint" - signed or unsigned integer of different sizes
 *   - "bit" - bit-values
 * - boolean properties
 *   - "bool" - boolean
 * - Special properties
 *   - "link" - single link
 *   - "multilink" - multi-link
 *   - "obj" - structured object
 *   - "arr" - array
 */
export type DataType =
    StringDataType | NumericDataType | TemporalDataType | BoolDataType |
    "link" | "multilink" | "obj" | "arr";



// /**
//  * Represents underlying data type corresponding to the given property type
//  */
// export type DataTypeOfPropType<M extends AModel, T extends PropType> =
//     T extends string ? "str" | "clob" | "date" | "time" | "datetime" | "timestamp" :
//     T extends number ? "int" | "real" | "dec" | "year" :
//     T extends bigint ? "bigint" | "bit" :
//     T extends boolean ? "bool" :
//     T extends MultiLink<AClass> ? "multilink" :
//     T extends Class<infer CN,any,any> ? CN extends ModelClassName<M>
//         ? "link"
//         : never :
//     never



/**
 * Maps data types to language types used to represent them.
 */
export type LangTypeOf<DT extends DataType> =
    DT extends StringDataType | TemporalDataType ? string :
    DT extends BigintDataType ? bigint :
    DT extends NumericDataType ? number :
    DT extends BoolDataType ? boolean :
    object;



