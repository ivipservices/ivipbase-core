import type { ValueCompareResult } from "./../../Types/index";
import NodeInfo from "./NodeInfo";
import { NodeAddress } from "./NodeAddress";
export * from "./NodeAddress";
export * from "./NodeCache";
export * from "./NodeChanges";
export { default as NodeInfo } from "./NodeInfo";
export * from "./NodeLock";
export declare class NodeNotFoundError extends Error {
}
export declare class NodeRevisionError extends Error {
}
declare const nodeValueTypes: {
    readonly EMPTY: 0;
    readonly OBJECT: 1;
    readonly ARRAY: 2;
    readonly NUMBER: 3;
    readonly BOOLEAN: 4;
    readonly STRING: 5;
    readonly BIGINT: 7;
    readonly DATETIME: 6;
    readonly BINARY: 8;
    readonly REFERENCE: 9;
    readonly DEDICATED_RECORD: 99;
};
export type NodeValueType = (typeof nodeValueTypes)[keyof typeof nodeValueTypes];
export declare const VALUE_TYPES: Record<"EMPTY" | "OBJECT" | "ARRAY" | "NUMBER" | "BOOLEAN" | "STRING" | "BIGINT" | "DATETIME" | "BINARY" | "REFERENCE" | "DEDICATED_RECORD", NodeValueType>;
export declare function getValueTypeName(valueType: number): "string" | "object" | "number" | "bigint" | "binary" | "array" | "boolean" | "date" | "reference" | "dedicated_record" | undefined;
export declare function getNodeValueType(value: unknown): NodeValueType;
export declare function getValueType(value: unknown): NodeValueType;
export declare class NodeSettings {
    /**
     * in bytes, max amount of child data to store within a parent record before moving to a dedicated record. Default is 50
     * @default 50
     */
    maxInlineValueSize: number;
    /**
     * Instead of throwing errors on undefined values, remove the properties automatically. Default is false
     * @default false
     */
    removeVoidProperties: boolean;
    constructor(options: Partial<NodeSettings>);
}
export declare class CustomStorageNodeInfo extends NodeInfo {
    address?: NodeAddress;
    revision: string;
    revision_nr: number;
    created: Date;
    modified: Date;
    constructor(info: Omit<CustomStorageNodeInfo, "valueType" | "valueTypeName">);
}
/** Interface for metadata being stored for nodes */
export declare class StorageNodeMetaData {
    /** cuid (time sortable revision id). Nodes stored in the same operation share this id */
    revision: string;
    /** Number of revisions, starting with 1. Resets to 1 after deletion and recreation */
    revision_nr: number;
    /** Creation date/time in ms since epoch UTC */
    created: number;
    /** Last modification date/time in ms since epoch UTC */
    modified: number;
    /** Type of the node's value. 1=object, 2=array, 3=number, 4=boolean, 5=string, 6=date, 7=reserved, 8=binary, 9=reference */
    type: NodeValueType;
}
/** Interface for metadata combined with a stored value */
export declare class StorageNode extends StorageNodeMetaData {
    /** only Object, Array, large string and binary values. */
    value: any;
    constructor();
}
export interface StorageNodeInfo {
    path: string;
    content: StorageNode;
}
export default class Node {
    readonly settings: NodeSettings;
    private nodes;
    constructor(byNodes?: StorageNodeInfo[], options?: Partial<NodeSettings>);
    isPathExists(path: string): boolean;
    push(...nodes: (StorageNodeInfo[] | StorageNodeInfo)[]): this;
    static get VALUE_TYPES(): Record<"EMPTY" | "OBJECT" | "ARRAY" | "NUMBER" | "BOOLEAN" | "STRING" | "BIGINT" | "DATETIME" | "BINARY" | "REFERENCE" | "DEDICATED_RECORD", NodeValueType>;
    /**
     * Checks if a value can be stored in a parent object, or if it should
     * move to a dedicated record. Uses settings.maxInlineValueSize
     * @param value
     */
    valueFitsInline(value: any): boolean;
    private getTypedChildValue;
    private processReadNodeValue;
    getNodesBy(path: string): StorageNodeInfo[];
    getNodeParentBy(path: string): StorageNodeInfo | undefined;
    getKeysBy(path: string): string[];
    getInfoBy(path: string, options?: {
        include_child_count?: boolean;
    }): CustomStorageNodeInfo;
    writeNode(path: string, value: any, options?: {
        merge?: boolean;
        revision?: string;
        currentValue?: any;
        diff?: ValueCompareResult;
    }): Node;
    deleteNode(path: string, specificNode?: boolean): Node;
    setNode(path: string, value: any, options?: {
        assert_revision?: string;
    }): Node;
    updateNode(path: string, updates: any): Node;
    importJson(path: string, value: any): Node;
    static parse(path: string, value: any, options?: Partial<NodeSettings>): StorageNodeInfo[];
    exportJson(nodes?: StorageNodeInfo[] | string, onlyChildren?: boolean, includeChildrenDedicated?: boolean): StorageNodeInfo;
    static toJson(nodes: StorageNodeInfo[], onlyChildren?: boolean, options?: Partial<NodeSettings>): StorageNodeInfo;
}
//# sourceMappingURL=index.d.ts.map