"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const SimpleEventEmitter_1 = __importDefault(require("../Lib/SimpleEventEmitter"));
class NotImplementedError extends Error {
    constructor(name) {
        super(`${name} is not implemented`);
    }
}
class LocalStorage extends SimpleEventEmitter_1.default {
    constructor() {
        super();
    }
    /**
     * Provides statistics
     * @param options
     */
    stats(options) {
        throw new NotImplementedError("stats");
    }
    /**
     * @param path
     * @param event event to subscribe to ("value", "child_added" etc)
     * @param callback callback function
     */
    subscribe(path, event, callback, settings) {
        throw new NotImplementedError("subscribe");
    }
    unsubscribe(path, event, callback) {
        throw new NotImplementedError("unsubscribe");
    }
    update(path, updates, options) {
        throw new NotImplementedError("update");
    }
    set(path, value, options) {
        throw new NotImplementedError("set");
    }
    get(path, options) {
        throw new NotImplementedError("get");
    }
    transaction(path, callback, options) {
        throw new NotImplementedError("transaction");
    }
    exists(path) {
        throw new NotImplementedError("exists");
    }
    query(path, query, options) {
        throw new NotImplementedError("query");
    }
    reflect(path, type, args) {
        throw new NotImplementedError("reflect");
    }
    export(path, write, options) {
        throw new NotImplementedError("export");
    }
    import(path, read, options) {
        throw new NotImplementedError("import");
    }
    setSchema(path, schema, warnOnly) {
        throw new NotImplementedError("setSchema");
    }
    getSchema(path) {
        throw new NotImplementedError("getSchema");
    }
    getSchemas() {
        throw new NotImplementedError("getSchemas");
    }
    validateSchema(path, value, isUpdate) {
        throw new NotImplementedError("validateSchema");
    }
    getMutations(filter) {
        throw new NotImplementedError("getMutations");
    }
    getChanges(filter) {
        throw new NotImplementedError("getChanges");
    }
}
exports.default = LocalStorage;
//# sourceMappingURL=index.js.map