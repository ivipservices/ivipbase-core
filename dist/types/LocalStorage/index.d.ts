import SimpleEventEmitter from "../Lib/SimpleEventEmitter";
import { EventSubscriptionCallback, EventSubscriptionSettings, StreamReadFunction, StreamWriteFunction } from "../Types";
import { Query, QueryOptions, ReflectionNodeInfo, ReflectionType, SchemaInfo, ValueChange, ValueMutation } from "../Types/LocalStorage";
export default abstract class LocalStorage extends SimpleEventEmitter {
    constructor();
    /**
     * Provides statistics
     * @param options
     */
    stats(options?: any): Promise<any>;
    /**
     * @param path
     * @param event event to subscribe to ("value", "child_added" etc)
     * @param callback callback function
     */
    subscribe(path: string, event: string, callback: EventSubscriptionCallback, settings?: EventSubscriptionSettings): void | Promise<void>;
    unsubscribe(path: string, event?: string, callback?: EventSubscriptionCallback): void | Promise<void>;
    update(path: string, updates: any, options?: any): Promise<{
        cursor?: string;
    }>;
    set(path: string, value: any, options?: any): Promise<{
        cursor?: string;
    }>;
    get(path: string, options?: any): Promise<{
        value: any;
        context: any;
        cursor?: string;
    }>;
    transaction(path: string, callback: (val: any) => any, options?: any): Promise<{
        cursor?: string;
    }>;
    exists(path: string): Promise<boolean>;
    query(path: string, query: Query, options?: QueryOptions): Promise<{
        results: Array<{
            path: string;
            val: any;
        }> | string[];
        context: any;
        stop(): Promise<void>;
    }>;
    reflect(path: string, type: "children", args: any): Promise<ReflectionNodeInfo>;
    reflect(path: string, type: "info", args: any): Promise<ReflectionNodeInfo>;
    reflect(path: string, type: ReflectionType, args: any): Promise<any>;
    export(path: string, write: StreamWriteFunction, options: any): Promise<void>;
    import(path: string, read: StreamReadFunction, options: any): Promise<void>;
    setSchema(path: string, schema: Record<string, any> | string, warnOnly?: boolean): Promise<void>;
    getSchema(path: string): Promise<SchemaInfo>;
    getSchemas(): Promise<SchemaInfo[]>;
    validateSchema(path: string, value: any, isUpdate: boolean): Promise<{
        ok: boolean;
        reason?: string;
        warning?: string;
    }>;
    getMutations(filter: ({
        cursor: string;
    } | {
        timestamp: number;
    }) & {
        path?: string;
        for?: Array<{
            path: string;
            events: string[];
        }>;
    }): Promise<{
        used_cursor: string | null;
        new_cursor: string;
        mutations: ValueMutation[];
    }>;
    getChanges(filter: ({
        cursor: string;
    } | {
        timestamp: number;
    }) & {
        path?: string;
        for?: Array<{
            path: string;
            events: string[];
        }>;
    }): Promise<{
        used_cursor: string | null;
        new_cursor: string;
        changes: ValueChange[];
    }>;
}
//# sourceMappingURL=index.d.ts.map