import { ObjectProperty, ValueCompareResult } from "src/Types";
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
export declare function cloneObject(original: any, stack?: any[]): any;
export declare function valuesAreEqual(val1: any, val2: any): boolean;
export declare function compareValues(oldVal: any, newVal: any, sortedResults?: boolean): ValueCompareResult;
export declare function getMutations(oldVal: any, newVal: any, sortedResults?: boolean): Array<{
    target: ObjectProperty[];
    prev: any;
    val: any;
}>;
export declare function getGlobalObject(): any;
//# sourceMappingURL=Utils.d.ts.map