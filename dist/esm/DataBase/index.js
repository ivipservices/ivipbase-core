import SimpleEventEmitter from "../Lib/SimpleEventEmitter.js";
import { DataReference, DataReferenceQuery } from "./reference.js";
import DebugLogger from "../Lib/DebugLogger.js";
import TypeMappings from "../Lib/TypeMappings.js";
export class DataBaseSettings {
    constructor(options) {
        /**
         * What level to use for console logging.
         * @default 'log'
         */
        this.logLevel = "log";
        /**
         * Whether to use colors in the console logs output
         * @default true
         */
        this.logColors = true;
        /**
         * @internal (for internal use)
         */
        this.info = "realtime database";
        if (typeof options !== "object") {
            options = {};
        }
        if (typeof options.logLevel === "string") {
            this.logLevel = options.logLevel;
        }
        if (typeof options.logColors === "boolean") {
            this.logColors = options.logColors;
        }
        if (typeof options.info === "string") {
            this.info = options.info;
        }
    }
}
export class DataBase extends SimpleEventEmitter {
    constructor(dbname, options = {}) {
        super();
        this._ready = false;
        options = new DataBaseSettings(options);
        this.name = dbname;
        // Setup console logging
        this.debug = new DebugLogger(options.logLevel, `[${dbname}]`);
        // Setup type mapping functionality
        this.types = new TypeMappings(this);
        this.once("ready", () => {
            // console.log(`database "${dbname}" (${this.constructor.name}) is ready to use`);
            this._ready = true;
        });
    }
    /**
     * Waits for the database to be ready before running your callback.
     * @param callback (optional) callback function that is called when the database is ready to be used. You can also use the returned promise.
     * @returns returns a promise that resolves when ready
     */
    async ready(callback) {
        if (!this._ready) {
            // Wait for ready event
            await new Promise((resolve) => this.on("ready", resolve));
        }
        callback?.();
    }
    get isReady() {
        return this._ready;
    }
    /**
     * Creates a reference to a node
     * @param path
     * @returns reference to the requested node
     */
    ref(path) {
        return new DataReference(this, path);
    }
    /**
     * Get a reference to the root database node
     * @returns reference to root node
     */
    get root() {
        return this.ref("");
    }
    /**
     * Creates a query on the requested node
     * @param path
     * @returns query for the requested node
     */
    query(path) {
        const ref = new DataReference(this, path);
        return new DataReferenceQuery(ref);
    }
    get schema() {
        return {
            get: (path) => {
                return this.storage.getSchema(path);
            },
            set: (path, schema, warnOnly = false) => {
                return this.storage.setSchema(path, schema, warnOnly);
            },
            all: () => {
                return this.storage.getSchemas();
            },
            check: (path, value, isUpdate) => {
                return this.storage.validateSchema(path, value, isUpdate);
            },
        };
    }
}
export default DataBase;
//# sourceMappingURL=index.js.map