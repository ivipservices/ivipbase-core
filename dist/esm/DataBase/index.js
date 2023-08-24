"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataBase = exports.DataBaseSettings = void 0;
const SimpleEventEmitter_1 = __importDefault(require("../Lib/SimpleEventEmitter"));
const reference_1 = require("./data/reference");
const DebugLogger_1 = __importDefault(require("../Lib/DebugLogger"));
const TypeMappings_1 = __importDefault(require("../Lib/TypeMappings"));
class DataBaseSettings {
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
exports.DataBaseSettings = DataBaseSettings;
class DataBase extends SimpleEventEmitter_1.default {
    constructor(dbname, options = {}) {
        super();
        this._ready = false;
        options = new DataBaseSettings(options);
        this.name = dbname;
        // Setup console logging
        this.debug = new DebugLogger_1.default(options.logLevel, `[${dbname}]`);
        // Setup type mapping functionality
        this.types = new TypeMappings_1.default(this);
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
        return new reference_1.DataReference(this, path);
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
        const ref = new reference_1.DataReference(this, path);
        return new reference_1.DataReferenceQuery(ref);
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
exports.DataBase = DataBase;
exports.default = DataBase;
//# sourceMappingURL=index.js.map