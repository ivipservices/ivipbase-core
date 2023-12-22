import { ObjectProperty, TypedArray, TypedArrayLike, ValueCompareResult } from "../Types";
export declare function numberToBytes(number: number): number[];
export declare function bytesToNumber(bytes: TypedArrayLike | TypedArray | number[]): number;
export declare const bigintToBytes: (number: bigint) => number[];
export declare const bytesToBigint: (bytes: TypedArrayLike | TypedArray | number[]) => bigint;
/**
 * Converts a string to a utf-8 encoded Uint8Array
 */
export declare function encodeString(str: string): Uint8Array;
/**
 * Converts a utf-8 encoded buffer to string
 */
export declare function decodeString(buffer: TypedArrayLike | TypedArray | number[]): string;
export declare function concatTypedArrays<T extends TypedArray>(a: T, b: TypedArray): T;
export declare function cloneObject(original: any, stack?: any[]): typeof original;
export declare function valuesAreEqual(val1: any, val2: any): boolean;
export declare class ObjectDifferences {
    added: ObjectProperty[];
    removed: ObjectProperty[];
    changed: Array<{
        key: ObjectProperty;
        change: ValueCompareResult;
    }>;
    constructor(added: ObjectProperty[], removed: ObjectProperty[], changed: Array<{
        key: ObjectProperty;
        change: ValueCompareResult;
    }>);
    forChild(key: ObjectProperty): ValueCompareResult;
}
export declare const isDate: (value: unknown) => boolean;
export declare function compareValues(oldVal: any, newVal: any, sortedResults?: boolean): ValueCompareResult;
export declare function getMutations(oldVal: any, newVal: any, sortedResults?: boolean): Array<{
    target: ObjectProperty[];
    prev: any;
    val: any;
}>;
export declare function getChildValues(childKey: ObjectProperty, oldValue: any, newValue: any): {
    oldValue: any;
    newValue: any;
};
export declare function defer(fn: (...args: any[]) => any): void;
export declare function getGlobalObject(): typeof globalThis;
export declare function contains<T extends object>(obj: T, key: string): boolean;
export declare function safeGet<T extends object, K extends keyof T>(obj: T, key: K): T[K] | undefined;
export declare function isEmpty(obj: object): obj is {};
/**
 * Deep equal two objects. Support Arrays and Objects.
 */
export declare function deepEqual(a: object, b: object): boolean;
/**
 * Copied from https://stackoverflow.com/a/2117523
 * Generates a new uuid.
 * @public
 */
export declare function uuidv4(): string;
//# sourceMappingURL=Utils.d.ts.map