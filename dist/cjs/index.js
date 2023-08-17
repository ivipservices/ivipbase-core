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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IStorageNode = exports.StorageNode = exports.ObjectCollection = exports.PartialArray = exports.SimpleObservable = exports.SchemaDefinition = exports.SimpleEventEmitter = exports.SimpleCache = exports.ascii85 = exports.Utils = exports.TypeMappings = exports.Transport = exports.EventSubscription = exports.EventPublisher = exports.EventStream = exports.PathInfo = exports.PathReference = exports.ID = exports.DebugLogger = exports.OrderedCollectionProxy = exports.proxyAccess = exports.MutationsDataSnapshot = exports.DataSnapshot = exports.DataReferencesArray = exports.DataSnapshotsArray = exports.QueryDataRetrievalOptions = exports.DataRetrievalOptions = exports.DataReferenceQuery = exports.DataReference = exports.Types = exports.LocalStorage = exports.DataBaseSettings = exports.DataBase = void 0;
var DataBase_1 = require("./DataBase");
Object.defineProperty(exports, "DataBase", { enumerable: true, get: function () { return DataBase_1.DataBase; } });
Object.defineProperty(exports, "DataBaseSettings", { enumerable: true, get: function () { return DataBase_1.DataBaseSettings; } });
var LocalStorage_1 = require("./LocalStorage");
Object.defineProperty(exports, "LocalStorage", { enumerable: true, get: function () { return __importDefault(LocalStorage_1).default; } });
exports.Types = __importStar(require("./Types"));
var reference_1 = require("./DataBase/data/reference");
Object.defineProperty(exports, "DataReference", { enumerable: true, get: function () { return reference_1.DataReference; } });
Object.defineProperty(exports, "DataReferenceQuery", { enumerable: true, get: function () { return reference_1.DataReferenceQuery; } });
Object.defineProperty(exports, "DataRetrievalOptions", { enumerable: true, get: function () { return reference_1.DataRetrievalOptions; } });
Object.defineProperty(exports, "QueryDataRetrievalOptions", { enumerable: true, get: function () { return reference_1.QueryDataRetrievalOptions; } });
Object.defineProperty(exports, "DataSnapshotsArray", { enumerable: true, get: function () { return reference_1.DataSnapshotsArray; } });
Object.defineProperty(exports, "DataReferencesArray", { enumerable: true, get: function () { return reference_1.DataReferencesArray; } });
var snapshot_1 = require("./DataBase/data/snapshot");
Object.defineProperty(exports, "DataSnapshot", { enumerable: true, get: function () { return snapshot_1.DataSnapshot; } });
Object.defineProperty(exports, "MutationsDataSnapshot", { enumerable: true, get: function () { return snapshot_1.MutationsDataSnapshot; } });
var proxy_1 = require("./DataBase/data/proxy");
Object.defineProperty(exports, "proxyAccess", { enumerable: true, get: function () { return proxy_1.proxyAccess; } });
Object.defineProperty(exports, "OrderedCollectionProxy", { enumerable: true, get: function () { return proxy_1.OrderedCollectionProxy; } });
var DebugLogger_1 = require("./Lib/DebugLogger");
Object.defineProperty(exports, "DebugLogger", { enumerable: true, get: function () { return __importDefault(DebugLogger_1).default; } });
var ID_1 = require("./Lib/ID");
Object.defineProperty(exports, "ID", { enumerable: true, get: function () { return __importDefault(ID_1).default; } });
var PathInfo_1 = require("./Lib/PathInfo");
Object.defineProperty(exports, "PathReference", { enumerable: true, get: function () { return PathInfo_1.PathReference; } });
Object.defineProperty(exports, "PathInfo", { enumerable: true, get: function () { return PathInfo_1.PathInfo; } });
var Subscription_1 = require("./Lib/Subscription");
Object.defineProperty(exports, "EventStream", { enumerable: true, get: function () { return Subscription_1.EventStream; } });
Object.defineProperty(exports, "EventPublisher", { enumerable: true, get: function () { return Subscription_1.EventPublisher; } });
Object.defineProperty(exports, "EventSubscription", { enumerable: true, get: function () { return Subscription_1.EventSubscription; } });
exports.Transport = __importStar(require("./Lib/Transport"));
var TypeMappings_1 = require("./Lib/TypeMappings");
Object.defineProperty(exports, "TypeMappings", { enumerable: true, get: function () { return __importDefault(TypeMappings_1).default; } });
exports.Utils = __importStar(require("./Lib/Utils"));
var Ascii85_1 = require("./Lib/Ascii85");
Object.defineProperty(exports, "ascii85", { enumerable: true, get: function () { return Ascii85_1.ascii85; } });
var SimpleCache_1 = require("./Lib/SimpleCache");
Object.defineProperty(exports, "SimpleCache", { enumerable: true, get: function () { return SimpleCache_1.SimpleCache; } });
var SimpleEventEmitter_1 = require("./Lib/SimpleEventEmitter");
Object.defineProperty(exports, "SimpleEventEmitter", { enumerable: true, get: function () { return __importDefault(SimpleEventEmitter_1).default; } });
var Schema_1 = require("./Lib/Schema");
Object.defineProperty(exports, "SchemaDefinition", { enumerable: true, get: function () { return Schema_1.SchemaDefinition; } });
var SimpleObservable_1 = require("./Lib/SimpleObservable");
Object.defineProperty(exports, "SimpleObservable", { enumerable: true, get: function () { return __importDefault(SimpleObservable_1).default; } });
var PartialArray_1 = require("./Lib/PartialArray");
Object.defineProperty(exports, "PartialArray", { enumerable: true, get: function () { return PartialArray_1.PartialArray; } });
var ObjectCollection_1 = require("./Lib/ObjectCollection");
Object.defineProperty(exports, "ObjectCollection", { enumerable: true, get: function () { return ObjectCollection_1.ObjectCollection; } });
var Node_1 = require("./LocalStorage/Node");
Object.defineProperty(exports, "StorageNode", { enumerable: true, get: function () { return __importDefault(Node_1).default; } });
exports.IStorageNode = __importStar(require("./LocalStorage/Node"));
//# sourceMappingURL=index.js.map