import SimpleEventEmitter from "src/Lib/SimpleEventEmitter";
import { DataReference, DataReferenceQuery } from "./data/reference";
import LocalStorage from "src/LocalStorage";
import { LoggingLevel } from "src/Types";
import DebugLogger from "src/Lib/DebugLogger";
import TypeMappings from "src/Lib/TypeMappings";
export declare class DataBaseSettings {
    /**
     * What level to use for console logging.
     * @default 'log'
     */
    logLevel: LoggingLevel;
    /**
     * Whether to use colors in the console logs output
     * @default true
     */
    logColors: boolean;
    /**
     * @internal (for internal use)
     */
    info: string;
    constructor(options: Partial<DataBaseSettings>);
}
export default abstract class DataBase extends SimpleEventEmitter {
    protected _ready: boolean;
    storage: LocalStorage;
    /**
     * @internal (for internal use)
     */
    debug: DebugLogger;
    /**
     * Type mappings
     */
    types: TypeMappings;
    readonly name: string;
    constructor(dbname: string, options?: Partial<DataBaseSettings>);
    /**
     * Waits for the database to be ready before running your callback.
     * @param callback (optional) callback function that is called when the database is ready to be used. You can also use the returned promise.
     * @returns returns a promise that resolves when ready
     */
    ready(callback?: () => void): Promise<void>;
    get isReady(): boolean;
    /**
     * Creates a reference to a node
     * @param path
     * @returns reference to the requested node
     */
    ref<T = any>(path: string): DataReference<T>;
    /**
     * Get a reference to the root database node
     * @returns reference to root node
     */
    get root(): DataReference;
    /**
     * Creates a query on the requested node
     * @param path
     * @returns query for the requested node
     */
    query(path: string): DataReferenceQuery;
}
//# sourceMappingURL=index.d.ts.map