import SimpleEventEmitter from "../Lib/SimpleEventEmitter";
import { EventSubscriptionCallback, EventSubscriptionSettings, StreamReadFunction, StreamWriteFunction } from "../Types";
import { Query, QueryOptions, ReflectionChildrenInfo, ReflectionNodeInfo, ReflectionType, SchemaInfo, ValueChange, ValueMutation } from "../Types/api";
export default abstract class Api extends SimpleEventEmitter {
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
    update(path: string, updates: any, options?: {
        /**
         * whether to suppress the execution of event subscriptions
         * @default false
         */
        suppress_events?: boolean;
        /**
         * Context to be passed along with data events
         * @default null
         */
        context?: any;
    }): Promise<{
        cursor?: string;
    }>;
    set(path: string, value: any, options?: {
        /**
         * whether to suppress the execution of event subscriptions
         * @default false
         */
        suppress_events?: boolean;
        /**
         * Context to be passed along with data events
         * @default null
         */
        context?: any;
    }): Promise<{
        cursor?: string;
    }>;
    get(path: string, options?: {
        /**
         * child keys (properties) to include
         */
        include?: string[];
        /**
         * chld keys (properties) to exclude
         */
        exclude?: string[];
        /**
         * whether to include child objects
         */
        child_objects?: boolean;
    }): Promise<{
        value: any;
        context: any;
        cursor?: string;
    }>;
    transaction(path: string, callback: (val: any) => any, options?: {
        /**
         * whether to suppress the execution of event subscriptions
         * @default false
         */
        suppress_events?: boolean;
        /**
         * Context to be passed along with data events
         * @default null
         */
        context?: any;
    }): Promise<{
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
    reflect(path: string, type: "children", args: any): Promise<ReflectionChildrenInfo>;
    reflect(path: string, type: "info", args: any): Promise<ReflectionNodeInfo>;
    reflect(path: string, type: ReflectionType, args: any): Promise<any>;
    export(path: string, write: StreamWriteFunction, options?: {
        format?: "json";
        type_safe?: boolean;
    }): Promise<void>;
    import(path: string, read: StreamReadFunction, options?: {
        format?: "json";
        suppress_events?: boolean;
        method?: "set" | "update" | "merge";
    }): Promise<void>;
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
//# sourceMappingURL=api.d.ts.map