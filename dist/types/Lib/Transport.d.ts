import { SerializedValue, V2SerializedValue } from "../Types/transport";
/**
 * Original deserialization method using global `map` and `val` properties
 * @param data
 * @returns
 */
export declare const deserialize: (data: SerializedValue) => any;
/**
 * Function to detect the used serialization method with for the given object
 * @param data
 * @returns
 */
export declare const detectSerializeVersion: (data: any) => 1 | 2;
/**
 * Original serialization method using global `map` and `val` properties
 * @param data
 * @returns
 */
export declare const serialize: (obj: any) => SerializedValue;
/**
 * New serialization method using inline `.type` and `.val` properties
 * @param obj
 * @returns
 */
export declare const serialize2: (obj: any) => V2SerializedValue;
/**
 * New deserialization method using inline `.type` and `.val` properties
 * @param obj
 * @returns
 */
export declare const deserialize2: (data: V2SerializedValue) => any;
//# sourceMappingURL=Transport.d.ts.map