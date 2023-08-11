import type { DataReference } from "../DataBase/data/reference";
import type { DataSnapshot } from "../DataBase/data/snapshot";
import type { EventStream } from "../Lib/Subscription";
import type { ObjectDifferences } from "../Lib/Utils";
import { ObjectCollection } from "../Lib/ObjectCollection";
export type * as TypeLocalStorage from "./LocalStorage";
export type * as TypeProxy from "./Proxy";
export type * as TypeSchema from "./schema";
export type * as TypeTransport from "./transport";
/**
 * Legacy (deprecated) IObjectCollection
 * @deprecated Use `ObjectCollection` instead
 */
export type IObjectCollection<T> = ObjectCollection<T>;
export type LoggingLevel = "verbose" | "log" | "warn" | "error";
export type LoggingFunction = (text: string, ...args: any[]) => void;
export type PathVariables = {
    [index: number]: string | number;
    [variable: string]: string | number;
};
export type EventCallback<T = DataSnapshot | DataReference> = (snapshotOrReference: T) => void;
export interface IEventSubscription {
    event: string;
    stream: EventStream;
    userCallback?: EventCallback;
    ourCallback(err: Error, path: string, newValue: any, oldValue?: any, eventContext?: any): void;
}
export type EventSubscriptionCallback = (err: Error | null, path: string, value: any, previous?: any, eventContext?: any) => void;
export type EventSubscriptionSettings = {
    newOnly: boolean;
    cancelCallback: (err: Error) => void;
    syncFallback: "reload" | (() => any | Promise<any>);
};
export type ValueEvent = "value" | "child_added" | "child_changed" | "child_removed" | "mutated" | "mutations";
export type NotifyEvent = "notify_value" | "notify_child_added" | "notify_child_changed" | "notify_child_removed" | "notify_mutated" | "notify_mutations";
export interface EventSettings {
    /**
     * Specifies whether to skip callbacks for current value (applies to `"value"` and `"child_added"` events)
     */
    newOnly?: boolean;
    /**
     * Enables you to implement custom sync logic if synchronization between client and server can't be de done
     * automatically for this event. For example, this callback will be executed for a `"child_changed"` event that
     * was added while offline and only fired for local cache changes until the server got connected; if no `"value"`
     * event subscription is active on the same path, you should manually update your local state by loading fresh
     * data from the server. Setting this property to `"reload"` will automatically do that.
     */
    syncFallback?: "reload" | (() => any | Promise<any>);
}
/**
 * Avoiding usage of Node's `Buffer` to prevent browser polyfills being used by bundlers
 */
export interface TypedArrayLike {
    byteLength: number;
    buffer: ArrayBuffer;
    [index: number]: number;
}
export type TypedArray = Uint8Array | Uint16Array | Uint32Array;
export interface IStreamLike {
    /**
     * Method that writes exported data to your stream
     * @param str string data to append
     * @returns Returns void or a Promise that resolves once writing to your stream is done. When returning a Promise, streaming will wait until it has resolved, so you can wait for eg a filestream to "drain".
     */
    write(str: string): void | Promise<void>;
}
/**
 * Function that writes exported data to your stream
 * @param str string data to append
 * @returns Returns void or a Promise that resolves once writing to your stream is done. When returning a Promise, streaming will wait until it has resolved, so you can wait for eg a filestream to "drain".
 */
export type StreamWriteFunction = (str: string) => void | Promise<void>;
/**
 * Function that reads data from your stream
 * @param length suggested number of bytes to read, reading more or less is allowed.
 * @returns Returns a string, typed array, or promise thereof
 */
export type StreamReadFunction = (length: number) => string | TypedArrayLike | Promise<string | TypedArrayLike>;
export type ValueCompareResult = "identical" | "added" | "removed" | "changed" | ObjectDifferences;
export type ObjectProperty = string | number;
/**
 * @deprecated Use `ValueCompareResult`
 */
export type TCompareResult = ValueCompareResult;
export interface ISubscription {
    unsubscribe(): any;
}
export interface IObserver<T> {
    next(value: T): any;
    start?(subscription: ISubscription): void;
    error?(error: any): any;
    complete?(value: any): void;
}
export type CleanupFunction = () => any;
export type CreateFunction<T> = (observer: IObserver<T>) => CleanupFunction;
export type SubscribeFunction<T> = (value: T) => any;
export interface IObservableLike<T> {
    subscribe(subscriber: SubscribeFunction<T>): ISubscription;
}
export type ForEachIteratorCallback<T = any> = (childSnapshot: DataSnapshot<T>) => boolean | void | Promise<boolean | void>;
export interface ForEachIteratorResult {
    canceled: boolean;
    total: number;
    processed: number;
}
export interface SimpleCacheOptions {
    /** The number of seconds to keep items cached after their last update */
    expirySeconds?: number;
    /** Whether to deep clone the stored values to protect them from accidental adjustments */
    cloneValues?: boolean;
    /** Maximum amount of entries to keep in cache */
    maxEntries?: number;
}
export type Constructable<T> = {
    new (...args: any[]): T;
};
//# sourceMappingURL=index.d.ts.map