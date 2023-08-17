"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageNode = exports.StorageNodeMetaData = exports.CustomStorageNodeInfo = exports.NodeSettings = exports.getValueType = exports.getNodeValueType = exports.getValueTypeName = exports.VALUE_TYPES = exports.NodeRevisionError = exports.NodeNotFoundError = exports.NodeInfo = void 0;
const PathInfo_1 = __importStar(require("../../Lib/PathInfo.js"));
const Utils_1 = require("../../Lib/Utils.js");
const Ascii85_1 = __importDefault(require("../../Lib/Ascii85.js"));
const ID_1 = __importDefault(require("../../Lib/ID.js"));
const Assert_1 = require("../../Lib/Assert.js");
const NodeInfo_1 = __importDefault(require("./NodeInfo.js"));
const NodeAddress_1 = require("./NodeAddress.js");
__exportStar(require("./NodeAddress.js"), exports);
__exportStar(require("./NodeCache.js"), exports);
__exportStar(require("./NodeChanges.js"), exports);
var NodeInfo_2 = require("./NodeInfo.js");
Object.defineProperty(exports, "NodeInfo", { enumerable: true, get: function () { return __importDefault(NodeInfo_2).default; } });
__exportStar(require("./NodeLock.js"), exports);
class NodeNotFoundError extends Error {
}
exports.NodeNotFoundError = NodeNotFoundError;
class NodeRevisionError extends Error {
}
exports.NodeRevisionError = NodeRevisionError;
const nodeValueTypes = {
    EMPTY: 0,
    // Native types:
    OBJECT: 1,
    ARRAY: 2,
    NUMBER: 3,
    BOOLEAN: 4,
    STRING: 5,
    BIGINT: 7,
    // Custom types:
    DATETIME: 6,
    BINARY: 8,
    REFERENCE: 9,
    DEDICATED_RECORD: 99,
};
exports.VALUE_TYPES = nodeValueTypes;
function getValueTypeName(valueType) {
    switch (valueType) {
        case exports.VALUE_TYPES.ARRAY:
            return "array";
        case exports.VALUE_TYPES.BINARY:
            return "binary";
        case exports.VALUE_TYPES.BOOLEAN:
            return "boolean";
        case exports.VALUE_TYPES.DATETIME:
            return "date";
        case exports.VALUE_TYPES.NUMBER:
            return "number";
        case exports.VALUE_TYPES.OBJECT:
            return "object";
        case exports.VALUE_TYPES.REFERENCE:
            return "reference";
        case exports.VALUE_TYPES.STRING:
            return "string";
        case exports.VALUE_TYPES.BIGINT:
            return "bigint";
        case exports.VALUE_TYPES.DEDICATED_RECORD:
            return "dedicated_record";
        default:
            "unknown";
    }
}
exports.getValueTypeName = getValueTypeName;
function getValueTypeDefault(valueType) {
    switch (valueType) {
        case exports.VALUE_TYPES.ARRAY:
            return [];
        case exports.VALUE_TYPES.OBJECT:
            return {};
        case exports.VALUE_TYPES.NUMBER:
            return 0;
        case exports.VALUE_TYPES.BOOLEAN:
            return false;
        case exports.VALUE_TYPES.STRING:
            return "";
        case exports.VALUE_TYPES.BIGINT:
            return BigInt(0);
        case exports.VALUE_TYPES.DATETIME:
            return new Date().toISOString();
        case exports.VALUE_TYPES.BINARY:
            return new Uint8Array();
        case exports.VALUE_TYPES.REFERENCE:
            return null;
        default:
            return undefined; // Or any other default value you prefer
    }
}
function getNodeValueType(value) {
    if (value instanceof Array) {
        return exports.VALUE_TYPES.ARRAY;
    }
    else if (value instanceof PathInfo_1.PathReference) {
        return exports.VALUE_TYPES.REFERENCE;
    }
    else if (value instanceof ArrayBuffer) {
        return exports.VALUE_TYPES.BINARY;
    }
    else if ((0, Utils_1.isDate)(value)) {
        return exports.VALUE_TYPES.DATETIME;
    }
    // TODO else if (value instanceof DataDocument) { return VALUE_TYPES.DOCUMENT; }
    else if (typeof value === "string") {
        return exports.VALUE_TYPES.STRING;
    }
    else if (typeof value === "object") {
        return exports.VALUE_TYPES.OBJECT;
    }
    else if (typeof value === "bigint") {
        return exports.VALUE_TYPES.BIGINT;
    }
    return exports.VALUE_TYPES.EMPTY;
}
exports.getNodeValueType = getNodeValueType;
function getValueType(value) {
    if (value instanceof Array) {
        return exports.VALUE_TYPES.ARRAY;
    }
    else if (value instanceof PathInfo_1.PathReference) {
        return exports.VALUE_TYPES.REFERENCE;
    }
    else if (value instanceof ArrayBuffer) {
        return exports.VALUE_TYPES.BINARY;
    }
    else if ((0, Utils_1.isDate)(value)) {
        return exports.VALUE_TYPES.DATETIME;
    }
    // TODO else if (value instanceof DataDocument) { return VALUE_TYPES.DOCUMENT; }
    else if (typeof value === "string") {
        return exports.VALUE_TYPES.STRING;
    }
    else if (typeof value === "object") {
        return exports.VALUE_TYPES.OBJECT;
    }
    else if (typeof value === "number") {
        return exports.VALUE_TYPES.NUMBER;
    }
    else if (typeof value === "boolean") {
        return exports.VALUE_TYPES.BOOLEAN;
    }
    else if (typeof value === "bigint") {
        return exports.VALUE_TYPES.BIGINT;
    }
    return exports.VALUE_TYPES.EMPTY;
}
exports.getValueType = getValueType;
class NodeSettings {
    constructor(options) {
        /**
         * in bytes, max amount of child data to store within a parent record before moving to a dedicated record. Default is 50
         * @default 50
         */
        this.maxInlineValueSize = 50;
        /**
         * Instead of throwing errors on undefined values, remove the properties automatically. Default is false
         * @default false
         */
        this.removeVoidProperties = false;
        if (typeof options.maxInlineValueSize === "number") {
            this.maxInlineValueSize = options.maxInlineValueSize;
        }
        if (typeof options.removeVoidProperties === "boolean") {
            this.removeVoidProperties = options.removeVoidProperties;
        }
    }
}
exports.NodeSettings = NodeSettings;
class CustomStorageNodeInfo extends NodeInfo_1.default {
    constructor(info) {
        super(info);
        this.revision = info.revision;
        this.revision_nr = info.revision_nr;
        this.created = info.created;
        this.modified = info.modified;
    }
}
exports.CustomStorageNodeInfo = CustomStorageNodeInfo;
/** Interface for metadata being stored for nodes */
class StorageNodeMetaData {
    constructor() {
        /** cuid (time sortable revision id). Nodes stored in the same operation share this id */
        this.revision = "";
        /** Number of revisions, starting with 1. Resets to 1 after deletion and recreation */
        this.revision_nr = 0;
        /** Creation date/time in ms since epoch UTC */
        this.created = 0;
        /** Last modification date/time in ms since epoch UTC */
        this.modified = 0;
        /** Type of the node's value. 1=object, 2=array, 3=number, 4=boolean, 5=string, 6=date, 7=reserved, 8=binary, 9=reference */
        this.type = 0;
    }
}
exports.StorageNodeMetaData = StorageNodeMetaData;
/** Interface for metadata combined with a stored value */
class StorageNode extends StorageNodeMetaData {
    constructor() {
        super();
        /** only Object, Array, large string and binary values. */
        this.value = null;
    }
}
exports.StorageNode = StorageNode;
class Node {
    constructor(byNodes = [], options = {}) {
        this.nodes = [];
        this.settings = new NodeSettings(options);
        this.push(byNodes);
        if (this.isPathExists("") !== true) {
            this.writeNode("", {});
        }
    }
    isPathExists(path) {
        const pathInfo = PathInfo_1.default.get(path);
        return (this.nodes.findIndex(({ path: nodePath }) => {
            return pathInfo.isOnTrailOf(nodePath);
        }) >= 0);
    }
    push(...nodes) {
        const forNodes = Array.prototype.concat
            .apply([], nodes.map((node) => (Array.isArray(node) ? node : [node])))
            .filter((node = {}) => node && typeof node.path === "string" && "content" in node) ?? [];
        for (let node of forNodes) {
            this.nodes.push(node);
        }
        return this;
    }
    static get VALUE_TYPES() {
        return exports.VALUE_TYPES;
    }
    /**
     * Checks if a value can be stored in a parent object, or if it should
     * move to a dedicated record. Uses settings.maxInlineValueSize
     * @param value
     */
    valueFitsInline(value) {
        if (typeof value === "number" || typeof value === "boolean" || (0, Utils_1.isDate)(value)) {
            return true;
        }
        else if (typeof value === "string") {
            if (value.length > this.settings.maxInlineValueSize) {
                return false;
            }
            // if the string has unicode chars, its byte size will be bigger than value.length
            const encoded = (0, Utils_1.encodeString)(value);
            return encoded.length < this.settings.maxInlineValueSize;
        }
        else if (value instanceof PathInfo_1.PathReference) {
            if (value.path.length > this.settings.maxInlineValueSize) {
                return false;
            }
            // if the path has unicode chars, its byte size will be bigger than value.path.length
            const encoded = (0, Utils_1.encodeString)(value.path);
            return encoded.length < this.settings.maxInlineValueSize;
        }
        else if (value instanceof ArrayBuffer) {
            return value.byteLength < this.settings.maxInlineValueSize;
        }
        else if (value instanceof Array) {
            return value.length === 0;
        }
        else if (typeof value === "object") {
            return Object.keys(value).length === 0;
        }
        else {
            throw new TypeError("What else is there?");
        }
    }
    getTypedChildValue(val) {
        if (val === null) {
            throw new Error(`Not allowed to store null values. remove the property`);
        }
        else if ((0, Utils_1.isDate)(val)) {
            return { type: exports.VALUE_TYPES.DATETIME, value: new Date(val).getTime() };
        }
        else if (["string", "number", "boolean"].includes(typeof val)) {
            return val;
        }
        else if (val instanceof PathInfo_1.PathReference) {
            return { type: exports.VALUE_TYPES.REFERENCE, value: val.path };
        }
        else if (val instanceof ArrayBuffer) {
            return { type: exports.VALUE_TYPES.BINARY, value: Ascii85_1.default.encode(val) };
        }
        else if (typeof val === "object") {
            (0, Assert_1.assert)(Object.keys(val).length === 0 || ("type" in val && val.type === exports.VALUE_TYPES.DEDICATED_RECORD), "child object stored in parent can only be empty");
            return val;
        }
    }
    processReadNodeValue(node) {
        const getTypedChildValue = (val) => {
            // Typed value stored in parent record
            if (val.type === exports.VALUE_TYPES.BINARY) {
                // binary stored in a parent record as a string
                return Ascii85_1.default.decode(val.value);
            }
            else if (val.type === exports.VALUE_TYPES.DATETIME) {
                // Date value stored as number
                return new Date(val.value);
            }
            else if (val.type === exports.VALUE_TYPES.REFERENCE) {
                // Path reference stored as string
                return new PathInfo_1.PathReference(val.value);
            }
            else if (val.type === exports.VALUE_TYPES.DEDICATED_RECORD) {
                return getValueTypeDefault(val.value);
            }
            else {
                throw new Error(`Unhandled child value type ${val.type}`);
            }
        };
        node = JSON.parse(JSON.stringify(node));
        switch (node.type) {
            case exports.VALUE_TYPES.ARRAY:
            case exports.VALUE_TYPES.OBJECT: {
                // check if any value needs to be converted
                // NOTE: Arrays are stored with numeric properties
                const obj = node.value;
                Object.keys(obj).forEach((key) => {
                    const item = obj[key];
                    if (typeof item === "object" && "type" in item) {
                        obj[key] = getTypedChildValue(item);
                    }
                });
                node.value = obj;
                break;
            }
            case exports.VALUE_TYPES.BINARY: {
                node.value = Ascii85_1.default.decode(node.value);
                break;
            }
            case exports.VALUE_TYPES.REFERENCE: {
                node.value = new PathInfo_1.PathReference(node.value);
                break;
            }
            case exports.VALUE_TYPES.STRING: {
                // No action needed
                // node.value = node.value;
                break;
            }
            default:
                throw new Error(`Invalid standalone record value type`); // should never happen
        }
        return node;
    }
    getNodesBy(path) {
        const pathInfo = PathInfo_1.default.get(path);
        return this.nodes.filter((node) => {
            const nodePath = PathInfo_1.default.get(node.path);
            return nodePath.path == pathInfo.path || pathInfo.isAncestorOf(nodePath);
        });
    }
    getNodeParentBy(path) {
        const pathInfo = PathInfo_1.default.get(path);
        return this.nodes
            .filter((node) => {
            const nodePath = PathInfo_1.default.get(node.path);
            return nodePath.path === "" || pathInfo.path === nodePath.path || nodePath.isParentOf(pathInfo);
        })
            .sort((a, b) => {
            const pathA = PathInfo_1.default.get(a.path);
            const pathB = PathInfo_1.default.get(b.path);
            return pathA.isDescendantOf(pathB.path) ? -1 : pathB.isDescendantOf(pathA.path) ? 1 : 0;
        })
            .shift();
    }
    getKeysBy(path) {
        const pathInfo = PathInfo_1.default.get(path);
        return this.nodes
            .filter((node) => pathInfo.isParentOf(node.path))
            .map((node) => {
            const key = PathInfo_1.default.get(node.path).key;
            return key ? key.toString() : null;
        })
            .filter((keys) => typeof keys === "string");
    }
    getInfoBy(path, options = {}) {
        const pathInfo = PathInfo_1.default.get(path);
        const node = this.getNodeParentBy(pathInfo.path);
        const defaultNode = new CustomStorageNodeInfo({
            path: pathInfo.path,
            key: typeof pathInfo.key === "string" ? pathInfo.key : undefined,
            index: typeof pathInfo.key === "number" ? pathInfo.key : undefined,
            type: 0,
            exists: false,
            address: undefined,
            created: new Date(),
            modified: new Date(),
            revision: "",
            revision_nr: 0,
        });
        if (!node) {
            return defaultNode;
        }
        const content = this.processReadNodeValue(node.content);
        let value = content.value;
        if (node.path !== pathInfo.path) {
            const keys = [pathInfo.key];
            let currentPath = pathInfo.parent;
            while (currentPath instanceof PathInfo_1.default && currentPath.path !== node.path) {
                if (currentPath.key !== null)
                    keys.unshift(currentPath.key);
                currentPath = currentPath.parent;
            }
            keys.forEach((key, index) => {
                if (value === null) {
                    return;
                }
                if (key !== null && [exports.VALUE_TYPES.OBJECT, exports.VALUE_TYPES.ARRAY].includes(getValueType(value)) && key in value) {
                    value = value[key];
                    return;
                }
                value = null;
            });
        }
        const containsChild = this.nodes.findIndex(({ path }) => pathInfo.isAncestorOf(path)) >= 0;
        const isArrayChild = (() => {
            if (containsChild)
                return false;
            const child = this.nodes.find(({ path }) => pathInfo.isParentOf(path));
            return child ? typeof PathInfo_1.default.get(child.path).key === "number" : false;
        })();
        const info = new CustomStorageNodeInfo({
            path: pathInfo.path,
            key: typeof pathInfo.key === "string" ? pathInfo.key : undefined,
            index: typeof pathInfo.key === "number" ? pathInfo.key : undefined,
            type: value !== null ? getValueType(value) : containsChild ? (isArrayChild ? exports.VALUE_TYPES.ARRAY : exports.VALUE_TYPES.OBJECT) : 0,
            exists: value !== null || containsChild,
            address: new NodeAddress_1.NodeAddress(node.path),
            created: new Date(content.created) ?? new Date(),
            modified: new Date(content.modified) ?? new Date(),
            revision: content.revision ?? "",
            revision_nr: content.revision_nr ?? 0,
        });
        const prepareValue = (value) => {
            return [exports.VALUE_TYPES.OBJECT, exports.VALUE_TYPES.ARRAY].includes(getValueType(value))
                ? Object.keys(value).reduce((result, key) => {
                    result[key] = this.getTypedChildValue(value[key]);
                    return result;
                }, {})
                : this.getTypedChildValue(value);
        };
        info.value = value ? prepareValue(value) : [exports.VALUE_TYPES.OBJECT, exports.VALUE_TYPES.ARRAY].includes(info.type) ? (info.type === exports.VALUE_TYPES.ARRAY ? [] : {}) : null;
        if (options.include_child_count && containsChild) {
            info.childCount = 0;
            if ([exports.VALUE_TYPES.OBJECT, exports.VALUE_TYPES.ARRAY].includes(info.valueType) && info.address) {
                // Get number of children
                info.childCount = value ? Object.keys(value ?? {}).length : 0;
                info.childCount += this.nodes
                    .filter(({ path }) => pathInfo.isAncestorOf(path))
                    .map(({ path }) => PathInfo_1.default.get(path.replace(new RegExp(`^${pathInfo.path}`, "gi"), "")).keys[1] ?? "")
                    .filter((path, index, list) => {
                    return list.indexOf(path) === index;
                }).length;
            }
        }
        return info;
    }
    writeNode(path, value, options = {}) {
        if (!options.merge && this.valueFitsInline(value) && path !== "") {
            throw new Error(`invalid value to store in its own node`);
        }
        else if (path === "" && (typeof value !== "object" || value instanceof Array)) {
            throw new Error(`Invalid root node value. Must be an object`);
        }
        if (options.merge && typeof options.currentValue === "undefined" && this.isPathExists(path)) {
            options.currentValue = this.exportJson(path).content.value;
        }
        //options.currentValue = options.currentValue ?? this.toJson(path);
        // Check if the value for this node changed, to prevent recursive calls to
        // perform unnecessary writes that do not change any data
        if (typeof options.diff === "undefined" && typeof options.currentValue !== "undefined") {
            options.diff = (0, Utils_1.compareValues)(options.currentValue, value);
            if (options.merge && typeof options.diff === "object") {
                options.diff.removed = options.diff.removed.filter((key) => value[key] === null); // Only keep "removed" items that are really being removed by setting to null
                if ([].concat(options.diff.changed, options.diff.added, options.diff.removed).length === 0) {
                    options.diff = "identical";
                }
            }
        }
        if (options.diff === "identical") {
            return this; // Done!
        }
        //const currentRow = options.currentValue.content;
        // Get info about current node at path
        const currentRow = options.currentValue === null ? null : this.exportJson(path, true, false).content;
        if (options.merge && currentRow) {
            if (currentRow.type === exports.VALUE_TYPES.ARRAY && !(value instanceof Array) && typeof value === "object" && Object.keys(value).some((key) => isNaN(parseInt(key)))) {
                throw new Error(`Cannot merge existing array of path "${path}" with an object`);
            }
            if (value instanceof Array && currentRow.type !== exports.VALUE_TYPES.ARRAY) {
                throw new Error(`Cannot merge existing object of path "${path}" with an array`);
            }
        }
        const pathInfo = PathInfo_1.default.get(path);
        const revision = ID_1.default.generate();
        const mainNode = {
            type: currentRow && currentRow.type === exports.VALUE_TYPES.ARRAY ? exports.VALUE_TYPES.ARRAY : exports.VALUE_TYPES.OBJECT,
            value: {},
        };
        const childNodeValues = {};
        if (value instanceof Array) {
            mainNode.type = exports.VALUE_TYPES.ARRAY;
            // Convert array to object with numeric properties
            const obj = {};
            for (let i = 0; i < value.length; i++) {
                obj[i] = value[i];
            }
            value = obj;
        }
        else if (value instanceof PathInfo_1.PathReference) {
            mainNode.type = exports.VALUE_TYPES.REFERENCE;
            mainNode.value = value.path;
        }
        else if (value instanceof ArrayBuffer) {
            mainNode.type = exports.VALUE_TYPES.BINARY;
            mainNode.value = Ascii85_1.default.encode(value);
        }
        else if (typeof value === "string") {
            mainNode.type = exports.VALUE_TYPES.STRING;
            mainNode.value = value;
        }
        const currentIsObjectOrArray = currentRow ? [exports.VALUE_TYPES.OBJECT, exports.VALUE_TYPES.ARRAY].includes(currentRow.type) : false;
        const newIsObjectOrArray = [exports.VALUE_TYPES.OBJECT, exports.VALUE_TYPES.ARRAY].includes(mainNode.type);
        const children = {
            current: [],
            new: [],
        };
        const isArray = mainNode.type === exports.VALUE_TYPES.ARRAY;
        let currentObject = null;
        if (currentIsObjectOrArray) {
            currentObject = currentRow?.value;
            children.current = Object.keys(currentObject ?? {});
            // if (currentObject instanceof Array) { // ALWAYS FALSE BECAUSE THEY ARE STORED AS OBJECTS WITH NUMERIC PROPERTIES
            //     // Convert array to object with numeric properties
            //     const obj = {};
            //     for (let i = 0; i < value.length; i++) {
            //         obj[i] = value[i];
            //     }
            //     currentObject = obj;
            // }
            if (newIsObjectOrArray) {
                mainNode.value = currentObject;
            }
        }
        if (newIsObjectOrArray) {
            // Object or array. Determine which properties can be stored in the main node,
            // and which should be stored in their own nodes
            if (!options.merge) {
                // Check which keys are present in the old object, but not in newly given object
                Object.keys(mainNode.value).forEach((key) => {
                    if (!(key in value)) {
                        // Property that was in old object, is not in new value -> set to null to mark deletion!
                        value[key] = null;
                    }
                });
            }
            Object.keys(value).forEach((key) => {
                const val = value[key];
                delete mainNode.value[key]; // key is being overwritten, moved from inline to dedicated, or deleted. TODO: check if this needs to be done SQLite & MSSQL implementations too
                if (val === null) {
                    //  || typeof val === 'undefined'
                    // This key is being removed
                    return;
                }
                else if (typeof val === "undefined") {
                    if (this.settings.removeVoidProperties === true) {
                        delete value[key]; // Kill the property in the passed object as well, to prevent differences in stored and working values
                        return;
                    }
                    else {
                        throw new Error(`Property "${key}" has invalid value. Cannot store undefined values. Set removeVoidProperties option to true to automatically remove undefined properties`);
                    }
                }
                // Where to store this value?
                if (this.valueFitsInline(val)) {
                    // Store in main node
                    mainNode.value[key] = val;
                }
                else {
                    // (mainNode.value as Record<string, any>)[key] = {
                    // 	type: VALUE_TYPES.DEDICATED_RECORD,
                    // 	value: getNodeValueType(val),
                    // 	path: pathInfo.childPath(isArray ? parseInt(key) : key),
                    // };
                    // Store in child node
                    delete mainNode.value[key];
                    childNodeValues[key] = val;
                }
            });
            const original = mainNode.value;
            mainNode.value = {};
            // If original is an array, it'll automatically be converted to an object now
            Object.keys(original).forEach((key) => {
                mainNode.value[key] = this.getTypedChildValue(original[key]);
            });
        }
        if (currentRow) {
            if (currentIsObjectOrArray || newIsObjectOrArray) {
                const keys = this.getKeysBy(pathInfo.path);
                children.current = children.current.concat(keys).filter((key, i, l) => l.indexOf(key) === i);
                if (newIsObjectOrArray) {
                    if (options && options.merge) {
                        children.new = children.current.slice();
                    }
                    Object.keys(value).forEach((key) => {
                        if (!children.new.includes(key)) {
                            children.new.push(key);
                        }
                    });
                }
                const changes = {
                    insert: children.new.filter((key) => !children.current.includes(key)),
                    update: [],
                    delete: options && options.merge ? Object.keys(value).filter((key) => value[key] === null) : children.current.filter((key) => !children.new.includes(key)),
                };
                changes.update = children.new.filter((key) => children.current.includes(key) && !changes.delete.includes(key));
                if (isArray && options.merge && (changes.insert.length > 0 || changes.delete.length > 0)) {
                    // deletes or inserts of individual array entries are not allowed, unless it is the last entry:
                    // - deletes would cause the paths of following items to change, which is unwanted because the actual data does not change,
                    // eg: removing index 3 on array of size 10 causes entries with index 4 to 9 to 'move' to indexes 3 to 8
                    // - inserts might introduce gaps in indexes,
                    // eg: adding to index 7 on an array of size 3 causes entries with indexes 3 to 6 to go 'missing'
                    const newArrayKeys = changes.update.concat(changes.insert);
                    const isExhaustive = newArrayKeys.every((k, index, arr) => arr.includes(index.toString()));
                    if (!isExhaustive) {
                        throw new Error(`Elements cannot be inserted beyond, or removed before the end of an array. Rewrite the whole array at path "${path}" or change your schema to use an object collection instead`);
                    }
                }
                for (let key in childNodeValues) {
                    const keyOrIndex = isArray ? parseInt(key) : key;
                    const childDiff = typeof options.diff === "object" ? options.diff.forChild(keyOrIndex) : undefined;
                    if (childDiff === "identical") {
                        continue;
                    }
                    const childPath = pathInfo.childPath(keyOrIndex);
                    const childValue = childNodeValues[keyOrIndex];
                    // Pass current child value to _writeNode
                    const currentChildValue = typeof options.currentValue === "undefined" // Fixing issue #20
                        ? undefined
                        : options.currentValue !== null && typeof options.currentValue === "object" && keyOrIndex in options.currentValue
                            ? options.currentValue[keyOrIndex]
                            : null;
                    this.writeNode(childPath, childValue, {
                        revision,
                        merge: false,
                        currentValue: currentChildValue,
                        diff: childDiff,
                    });
                }
                // Delete all child nodes that were stored in their own record, but are being removed
                // Also delete nodes that are being moved from a dedicated record to inline
                const movingNodes = newIsObjectOrArray ? keys.filter((key) => key in mainNode.value) : []; // moving from dedicated to inline value
                const deleteDedicatedKeys = changes.delete.concat(movingNodes);
                for (let key of deleteDedicatedKeys) {
                    const keyOrIndex = isArray ? parseInt(key) : key;
                    const childPath = pathInfo.childPath(keyOrIndex);
                    this.deleteNode(childPath);
                }
            }
            this.deleteNode(pathInfo.path, true);
            this.nodes.push({
                path: pathInfo.path,
                content: {
                    type: mainNode.type,
                    value: mainNode.value,
                    revision: currentRow.revision,
                    revision_nr: currentRow.revision_nr + 1,
                    created: currentRow.created,
                    modified: Date.now(),
                },
            });
        }
        else {
            for (let key in childNodeValues) {
                const keyOrIndex = isArray ? parseInt(key) : key;
                const childPath = pathInfo.childPath(keyOrIndex);
                const childValue = childNodeValues[keyOrIndex];
                this.writeNode(childPath, childValue, {
                    revision,
                    merge: false,
                    currentValue: null,
                });
            }
            this.deleteNode(pathInfo.path, true);
            this.nodes.push({
                path: pathInfo.path,
                content: {
                    type: mainNode.type,
                    value: mainNode.value,
                    revision: revision,
                    revision_nr: 1,
                    created: Date.now(),
                    modified: Date.now(),
                },
            });
        }
        return this;
    }
    deleteNode(path, specificNode = false) {
        const pathInfo = PathInfo_1.default.get(path);
        this.nodes = this.nodes.filter(({ path }) => {
            const nodePath = PathInfo_1.default.get(path);
            return specificNode ? pathInfo.path !== nodePath.path : !pathInfo.isAncestorOf(nodePath) && pathInfo.path !== nodePath.path;
        });
        return this;
    }
    setNode(path, value, options = {}) {
        const pathInfo = PathInfo_1.default.get(path);
        try {
            if (path === "") {
                if (value === null || typeof value !== "object" || value instanceof Array || value instanceof ArrayBuffer || ("buffer" in value && value.buffer instanceof ArrayBuffer)) {
                    throw new Error(`Invalid value for root node: ${value}`);
                }
                this.writeNode("", value, { merge: false });
            }
            else if (typeof options.assert_revision !== "undefined") {
                const info = this.getInfoBy(path);
                if (info.revision !== options.assert_revision) {
                    throw new NodeRevisionError(`revision '${info.revision}' does not match requested revision '${options.assert_revision}'`);
                }
                if (info.address && info.address.path === path && value !== null && !this.valueFitsInline(value)) {
                    // Overwrite node
                    this.writeNode(path, value, { merge: false });
                }
                else {
                    // Update parent node
                    // const lockPath = transaction.moveToParentPath(pathInfo.parentPath);
                    // assert(lockPath === pathInfo.parentPath, `transaction.moveToParentPath() did not move to the right parent path of "${path}"`);
                    this.writeNode(pathInfo.parentPath, { [pathInfo.key]: value }, { merge: true });
                }
            }
            else {
                // Delegate operation to update on parent node
                // const lockPath = await transaction.moveToParentPath(pathInfo.parentPath);
                // assert(lockPath === pathInfo.parentPath, `transaction.moveToParentPath() did not move to the right parent path of "${path}"`);
                this.updateNode(pathInfo.parentPath, { [pathInfo.key]: value });
            }
        }
        catch (err) {
            throw err;
        }
        return this;
    }
    updateNode(path, updates) {
        if (typeof updates !== "object") {
            throw new Error(`invalid updates argument`); //. Must be a non-empty object or array
        }
        else if (Object.keys(updates).length === 0) {
            return this; // Nothing to update. Done!
        }
        try {
            const nodeInfo = this.getInfoBy(path);
            const pathInfo = PathInfo_1.default.get(path);
            if (nodeInfo.exists && nodeInfo.address && nodeInfo.address.path === path) {
                this.writeNode(path, updates, { merge: true });
            }
            else if (nodeInfo.exists) {
                // Node exists, but is stored in its parent node.
                // const pathInfo = PathInfo.get(path);
                // const lockPath = transaction.moveToParentPath(pathInfo.parentPath);
                // assert(lockPath === pathInfo.parentPath, `transaction.moveToParentPath() did not move to the right parent path of "${path}"`);
                this.writeNode(pathInfo.parentPath, { [pathInfo.key]: updates }, { merge: true });
            }
            else {
                // The node does not exist, it's parent doesn't have it either. Update the parent instead
                // const lockPath = transaction.moveToParentPath(pathInfo.parentPath);
                // assert(lockPath === pathInfo.parentPath, `transaction.moveToParentPath() did not move to the right parent path of "${path}"`);
                this.updateNode(pathInfo.parentPath, { [pathInfo.key]: updates });
            }
        }
        catch (err) {
            throw err;
        }
        return this;
    }
    importJson(path, value) {
        return this.setNode(path, value);
    }
    static parse(path, value, options = {}) {
        return new Node([], options).writeNode(path, value).getNodesBy(path);
    }
    exportJson(nodes, onlyChildren = false, includeChildrenDedicated = true) {
        const byPathRoot = typeof nodes === "string" ? nodes : undefined;
        nodes = typeof nodes === "string" ? this.getNodesBy(nodes) : Array.isArray(nodes) ? nodes : [nodes];
        nodes = Array.isArray(nodes) ? nodes.filter((node = {}) => node && typeof node.path === "string" && "content" in node) : this.nodes;
        let byNodes = nodes.map((node) => {
            node = JSON.parse(JSON.stringify(node));
            node.content = this.processReadNodeValue(node.content);
            return node;
        });
        let revision = (byNodes[0]?.content ?? {}).revision ?? ID_1.default.generate();
        const rootNode = {
            path: PathInfo_1.default.get(byPathRoot ?? "").path,
            content: {
                type: 1,
                value: {},
                revision: revision,
                revision_nr: 1,
                created: Date.now(),
                modified: Date.now(),
            },
        };
        if (byNodes.length === 0) {
            return rootNode;
        }
        byNodes.sort((a, b) => {
            const pathA = PathInfo_1.default.get(a.path);
            const pathB = PathInfo_1.default.get(b.path);
            return pathA.isDescendantOf(pathB.path) ? 1 : pathB.isDescendantOf(pathA.path) ? -1 : 0;
        });
        if (byPathRoot) {
            const pathRoot = PathInfo_1.default.get(byPathRoot);
            const rootExists = byNodes.findIndex(({ path }) => pathRoot.path === path) >= 0;
            if (!rootExists) {
                rootNode.content.revision = byNodes[0]?.content.revision ?? revision;
                rootNode.content.revision_nr = byNodes[0]?.content.revision_nr ?? 1;
                rootNode.content.created = byNodes[0]?.content.created ?? Date.now();
                rootNode.content.modified = byNodes[0]?.content.modified ?? Date.now();
                byNodes.unshift(rootNode);
            }
        }
        const { path, content: targetNode } = byNodes.shift();
        const pathInfo = PathInfo_1.default.get(path);
        const result = targetNode;
        if (!includeChildrenDedicated) {
            onlyChildren = false;
        }
        if (onlyChildren) {
            byNodes = byNodes
                .filter((node) => {
                const nodePath = PathInfo_1.default.get(node.path);
                const isChild = nodePath.isChildOf(path);
                if (!isChild && nodePath.isDescendantOf(path)) {
                    const childKeys = PathInfo_1.default.get(nodePath.path.replace(new RegExp(`^${path}`, "gi"), "")).keys;
                    if (childKeys[1] && !(childKeys[1] in result.value)) {
                        result.value[childKeys[1]] = typeof childKeys[2] === "number" ? [] : {};
                    }
                }
                return isChild;
            })
                .map((node) => {
                node.content.value = node.content.type === exports.VALUE_TYPES.OBJECT ? {} : node.content.type === exports.VALUE_TYPES.ARRAY ? [] : node.content.value;
                return node;
            })
                .filter((node) => node.content.value !== null);
        }
        const objectToArray = (obj) => {
            // Convert object value to array
            const arr = [];
            Object.keys(obj).forEach((key) => {
                const index = parseInt(key);
                arr[index] = obj[index];
            });
            return arr;
        };
        if (targetNode.type === exports.VALUE_TYPES.ARRAY) {
            result.value = objectToArray(result.value);
        }
        if ([exports.VALUE_TYPES.OBJECT, exports.VALUE_TYPES.ARRAY].includes(targetNode.type)) {
            const targetPathKeys = PathInfo_1.default.getPathKeys(path);
            const value = targetNode.value;
            for (let { path: otherPath, content: otherNode } of byNodes) {
                const pathKeys = PathInfo_1.default.getPathKeys(otherPath);
                const trailKeys = pathKeys.slice(targetPathKeys.length);
                let parent = value;
                for (let j = 0; j < trailKeys.length; j++) {
                    (0, Assert_1.assert)(typeof parent === "object", "parent must be an object/array to have children!!");
                    const key = trailKeys[j];
                    const isLast = j === trailKeys.length - 1;
                    const nodeType = isLast ? otherNode.type : typeof trailKeys[j + 1] === "number" ? exports.VALUE_TYPES.ARRAY : exports.VALUE_TYPES.OBJECT;
                    let nodeValue;
                    if (!isLast) {
                        nodeValue = nodeType === exports.VALUE_TYPES.OBJECT ? {} : [];
                    }
                    else {
                        nodeValue = otherNode.value;
                        if (nodeType === exports.VALUE_TYPES.ARRAY) {
                            nodeValue = objectToArray(nodeValue);
                        }
                    }
                    const mergePossible = key in parent && typeof parent[key] === typeof nodeValue && [exports.VALUE_TYPES.OBJECT, exports.VALUE_TYPES.ARRAY].includes(nodeType);
                    if (mergePossible) {
                        Object.keys(nodeValue).forEach((childKey) => {
                            parent[key][childKey] = nodeValue[childKey];
                        });
                    }
                    else {
                        parent[key] = nodeValue;
                    }
                    parent = parent[key];
                }
            }
        }
        if (!includeChildrenDedicated && [exports.VALUE_TYPES.OBJECT, exports.VALUE_TYPES.ARRAY].includes(result.type)) {
            Object.keys(result.value).forEach((key) => {
                const val = result.value[key];
                delete result.value[key];
                if (val === null || typeof val === "undefined") {
                    return;
                }
                if (this.valueFitsInline(val)) {
                    result.value[key] = val;
                }
                else {
                    delete result.value[key];
                }
            });
        }
        return {
            path: pathInfo.path,
            content: result,
        };
    }
    static toJson(nodes, onlyChildren = false, options = {}) {
        return new Node([], options).exportJson(nodes, onlyChildren);
    }
}
exports.default = Node;
//# sourceMappingURL=index.js.map