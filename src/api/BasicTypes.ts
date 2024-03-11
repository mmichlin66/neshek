/**
 * Represents language-specific scalar types used to work with class properties.
 */
export type LangType = string | number| bigint | boolean | null | undefined;



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
 * Represents underlying data types corresponding to any property types except Boolean:
 */
export type NonBoolDataType = StringDataType | NumericDataType | TemporalDataType;

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


// export type Num_0_9 = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
// export type Num_1_9 = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

// export type Num_00_23 = `${0|1}${Num_0_9}` | `2${0|2|3}`;
// export type Num_00_59 = `${0|1|2|3|4|5}${Num_0_9}`;
// export type SqlTime = `${Num_00_23}:${Num_00_59}:${Num_00_59}`// | `${HH}:${mm}:${ss}.${number}`;

// export type Num_01_12 = `0${Num_1_9}` | `1${0|1|2}`;
// export type Num_01_31 = `${0}${Num_1_9}` | `${1|2}${Num_0_9}` | `3${0|1}`;
// export type SqlDate = `${Num_0_9}${Num_0_9}${Num_0_9}${Num_0_9}-${Num_01_12}-${Num_01_31}`



/**
 * Represents data type corresponding to the given language type
 */
export type DataTypeOf<T extends LangType> =
    // T extends SqlTime ? "time" :
    T extends string ? "str" | "clob" | "date" | "time" | "datetime" | "timestamp" :
    T extends number ? "int" | "real" | "dec" | "year" :
    T extends bigint ? "bigint" | "bit" :
    T extends boolean ? "bool" :
    undefined



/**
 * Maps data types to language types used to represent them.
 */
export type LangTypeOf<DT extends DataType | undefined | null> =
    DT extends StringDataType | TemporalDataType ? string :
    DT extends BigintDataType ? bigint : // this line must be before NumericDataType to take effect
    DT extends NumericDataType ? number :
    DT extends BoolDataType ? boolean :
    DT extends undefined ? undefined :
    DT extends null ? null :
    never;



