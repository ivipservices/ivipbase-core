import type { TCompareResult } from "./../../Types/index";
import PathInfo, { PathReference } from "../../Lib/PathInfo";
import { compareValues, encodeString, isDate } from "../../Lib/Utils";
import ascii85 from "../../Lib/Ascii85";
import ID from "../../Lib/ID";
import { assert } from "../../Lib/Assert";

export * from "./NodeAddress";
export * from "./NodeCache";
export * from "./NodeChanges";
export { default as NodeInfo } from "./NodeInfo";
export * from "./NodeLock";

export class NodeNotFoundError extends Error {}
export class NodeRevisionError extends Error {}

const nodeValueTypes = {
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
} as const;

export type NodeValueType = (typeof nodeValueTypes)[keyof typeof nodeValueTypes];
export const VALUE_TYPES = nodeValueTypes as Record<keyof typeof nodeValueTypes, NodeValueType>;

export function getValueTypeName(valueType: number) {
	switch (valueType) {
		case VALUE_TYPES.ARRAY:
			return "array";
		case VALUE_TYPES.BINARY:
			return "binary";
		case VALUE_TYPES.BOOLEAN:
			return "boolean";
		case VALUE_TYPES.DATETIME:
			return "date";
		case VALUE_TYPES.NUMBER:
			return "number";
		case VALUE_TYPES.OBJECT:
			return "object";
		case VALUE_TYPES.REFERENCE:
			return "reference";
		case VALUE_TYPES.STRING:
			return "string";
		case VALUE_TYPES.BIGINT:
			return "bigint";
		// case VALUE_TYPES.DOCUMENT: return 'document';
		default:
			"unknown";
	}
}

export function getNodeValueType(value: unknown) {
	if (value instanceof Array) {
		return VALUE_TYPES.ARRAY;
	} else if (value instanceof PathReference) {
		return VALUE_TYPES.REFERENCE;
	} else if (value instanceof ArrayBuffer) {
		return VALUE_TYPES.BINARY;
	} else if (isDate(value)) {
		return VALUE_TYPES.DATETIME;
	}
	// TODO else if (value instanceof DataDocument) { return VALUE_TYPES.DOCUMENT; }
	else if (typeof value === "string") {
		return VALUE_TYPES.STRING;
	} else if (typeof value === "object") {
		return VALUE_TYPES.OBJECT;
	} else if (typeof value === "bigint") {
		return VALUE_TYPES.BIGINT;
	}
	throw new Error(`Invalid value for standalone node: ${value}`);
}

export function getValueType(value: unknown) {
	if (value instanceof Array) {
		return VALUE_TYPES.ARRAY;
	} else if (value instanceof PathReference) {
		return VALUE_TYPES.REFERENCE;
	} else if (value instanceof ArrayBuffer) {
		return VALUE_TYPES.BINARY;
	} else if (isDate(value)) {
		return VALUE_TYPES.DATETIME;
	}
	// TODO else if (value instanceof DataDocument) { return VALUE_TYPES.DOCUMENT; }
	else if (typeof value === "string") {
		return VALUE_TYPES.STRING;
	} else if (typeof value === "object") {
		return VALUE_TYPES.OBJECT;
	} else if (typeof value === "number") {
		return VALUE_TYPES.NUMBER;
	} else if (typeof value === "boolean") {
		return VALUE_TYPES.BOOLEAN;
	} else if (typeof value === "bigint") {
		return VALUE_TYPES.BIGINT;
	}
	throw new Error(`Unknown value type: ${value}`);
}

export class NodeSettings {
	/**
	 * in bytes, max amount of child data to store within a parent record before moving to a dedicated record. Default is 50
	 * @default 50
	 */
	maxInlineValueSize: number = 50;

	/**
	 * Instead of throwing errors on undefined values, remove the properties automatically. Default is false
	 * @default false
	 */
	removeVoidProperties: boolean = false;

	constructor(options: Partial<NodeSettings>) {
		if (typeof options.maxInlineValueSize === "number") {
			this.maxInlineValueSize = options.maxInlineValueSize;
		}

		if (typeof options.removeVoidProperties === "boolean") {
			this.removeVoidProperties = options.removeVoidProperties;
		}
	}
}

/** Interface for metadata being stored for nodes */
export class StorageNodeMetaData {
	/** cuid (time sortable revision id). Nodes stored in the same operation share this id */
	revision = "";
	/** Number of revisions, starting with 1. Resets to 1 after deletion and recreation */
	revision_nr = 0;
	/** Creation date/time in ms since epoch UTC */
	created = 0;
	/** Last modification date/time in ms since epoch UTC */
	modified = 0;
	/** Type of the node's value. 1=object, 2=array, 3=number, 4=boolean, 5=string, 6=date, 7=reserved, 8=binary, 9=reference */
	type = 0 as NodeValueType;
}

/** Interface for metadata combined with a stored value */
export class StorageNode extends StorageNodeMetaData {
	/** only Object, Array, large string and binary values. */
	value: any = null;
	constructor() {
		super();
	}
}

export interface StorageNodeInfo {
	path: string;
	content: StorageNode;
}

export default class Node {
	readonly settings: NodeSettings;

	constructor(options: Partial<NodeSettings> = {}) {
		this.settings = new NodeSettings(options);
	}

	static get VALUE_TYPES() {
		return VALUE_TYPES;
	}

	/**
	 * Checks if a value can be stored in a parent object, or if it should
	 * move to a dedicated record. Uses settings.maxInlineValueSize
	 * @param value
	 */
	valueFitsInline(value: any) {
		if (typeof value === "number" || typeof value === "boolean" || isDate(value)) {
			return true;
		} else if (typeof value === "string") {
			if (value.length > this.settings.maxInlineValueSize) {
				return false;
			}
			// if the string has unicode chars, its byte size will be bigger than value.length
			const encoded = encodeString(value);
			return encoded.length < this.settings.maxInlineValueSize;
		} else if (value instanceof PathReference) {
			if (value.path.length > this.settings.maxInlineValueSize) {
				return false;
			}
			// if the path has unicode chars, its byte size will be bigger than value.path.length
			const encoded = encodeString(value.path);
			return encoded.length < this.settings.maxInlineValueSize;
		} else if (value instanceof ArrayBuffer) {
			return value.byteLength < this.settings.maxInlineValueSize;
		} else if (value instanceof Array) {
			return value.length === 0;
		} else if (typeof value === "object") {
			return Object.keys(value).length === 0;
		} else {
			throw new TypeError("What else is there?");
		}
	}

	private getTypedChildValue(val: any) {
		if (val === null) {
			throw new Error(`Not allowed to store null values. remove the property`);
		} else if (isDate(val)) {
			return { type: VALUE_TYPES.DATETIME, value: new Date(val).getTime() };
		} else if (["string", "number", "boolean"].includes(typeof val)) {
			return val;
		} else if (val instanceof PathReference) {
			return { type: VALUE_TYPES.REFERENCE, value: val.path };
		} else if (val instanceof ArrayBuffer) {
			return { type: VALUE_TYPES.BINARY, value: ascii85.encode(val) };
		} else if (typeof val === "object") {
			assert(Object.keys(val).length === 0, "child object stored in parent can only be empty");
			return val;
		}
	}

	private processReadNodeValue(node: StorageNode): StorageNode {
		const getTypedChildValue = (val: { type: number; value: any }) => {
			// Typed value stored in parent record
			if (val.type === VALUE_TYPES.BINARY) {
				// binary stored in a parent record as a string
				return ascii85.decode(val.value);
			} else if (val.type === VALUE_TYPES.DATETIME) {
				// Date value stored as number
				return new Date(val.value);
			} else if (val.type === VALUE_TYPES.REFERENCE) {
				// Path reference stored as string
				return new PathReference(val.value);
			} else {
				throw new Error(`Unhandled child value type ${val.type}`);
			}
		};

		switch (node.type) {
			case VALUE_TYPES.ARRAY:
			case VALUE_TYPES.OBJECT: {
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

			case VALUE_TYPES.BINARY: {
				node.value = ascii85.decode(node.value);
				break;
			}

			case VALUE_TYPES.REFERENCE: {
				node.value = new PathReference(node.value);
				break;
			}

			case VALUE_TYPES.STRING: {
				// No action needed
				// node.value = node.value;
				break;
			}

			default:
				throw new Error(`Invalid standalone record value type`); // should never happen
		}

		return node;
	}

	parse(path: string, value: any): StorageNodeInfo[] {
		if (this.valueFitsInline(value) && path !== "") {
			throw new Error(`invalid value to store in its own node`);
		} else if (path === "" && (typeof value !== "object" || value instanceof Array)) {
			throw new Error(`Invalid root node value. Must be an object`);
		}

		const pathInfo = PathInfo.get(path);

		const revision = ID.generate();

		const mainNode = {
			type: value instanceof Array ? VALUE_TYPES.ARRAY : VALUE_TYPES.OBJECT,
			value: {} as Record<string, any> | string,
		};

		const childNodeValues = {} as Record<string | number, any>;

		if (value instanceof Array) {
			mainNode.type = VALUE_TYPES.ARRAY;
			// Convert array to object with numeric properties
			const obj = {} as Record<number, any>;
			for (let i = 0; i < value.length; i++) {
				obj[i] = value[i];
			}
			value = obj;
		} else if (value instanceof PathReference) {
			mainNode.type = VALUE_TYPES.REFERENCE;
			mainNode.value = value.path;
		} else if (value instanceof ArrayBuffer) {
			mainNode.type = VALUE_TYPES.BINARY;
			mainNode.value = ascii85.encode(value);
		} else if (typeof value === "string") {
			mainNode.type = VALUE_TYPES.STRING;
			mainNode.value = value;
		}

		const isObjectOrArray = [VALUE_TYPES.OBJECT, VALUE_TYPES.ARRAY].includes(mainNode.type);

		if (isObjectOrArray) {
			Object.keys(value).forEach((key) => {
				const val = value[key];
				delete (mainNode.value as Record<string, any>)[key]; // key is being overwritten, moved from inline to dedicated, or deleted. TODO: check if this needs to be done SQLite & MSSQL implementations too
				if (val === null) {
					//  || typeof val === 'undefined'
					// This key is being removed
					return;
				} else if (typeof val === "undefined") {
					if (this.settings.removeVoidProperties === true) {
						delete value[key]; // Kill the property in the passed object as well, to prevent differences in stored and working values
						return;
					} else {
						throw new Error(`Property "${key}" has invalid value. Cannot store undefined values. Set removeVoidProperties option to true to automatically remove undefined properties`);
					}
				}
				// Where to store this value?
				if (this.valueFitsInline(val)) {
					// Store in main node
					(mainNode.value as Record<string, any>)[key] = val;
				} else {
					// Store in child node
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

		const isArray = mainNode.type === VALUE_TYPES.ARRAY;

		const nodes: StorageNodeInfo[] = Array.prototype.concat.apply(
			[],
			Object.keys(childNodeValues).map((key) => {
				const keyOrIndex = isArray ? parseInt(key) : key;
				const childPath = pathInfo.childPath(keyOrIndex);
				const childValue = childNodeValues[keyOrIndex];
				return this.parse(childPath, childValue) ?? [];
			}),
		);

		nodes.push({
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

		return nodes;
	}

	static parse(path: string, value: any, options: Partial<NodeSettings> = {}): StorageNodeInfo[] {
		return new Node(options).parse(path, value);
	}

	toJson(...nodes: (StorageNodeInfo[] | StorageNodeInfo)[]): StorageNodeInfo {
		const byNodes = Array.prototype.concat
			.apply(
				[],
				nodes.map((node) => (Array.isArray(node) ? node : [node])),
			)
			.filter((node: any = {}) => node && typeof node.path === "string" && "content" in node)
			.map((node) => {
				node.content = this.processReadNodeValue(node.content);
				return node;
			}) as StorageNodeInfo[];

		if (byNodes.length === 0) {
			throw new Error(`invalid nodes for conversion`);
		}

		byNodes.sort((a: StorageNodeInfo, b: StorageNodeInfo): number => {
			const pathA = PathInfo.get(a.path);
			const pathB = PathInfo.get(b.path);
			return pathA.isDescendantOf(pathB.path) ? 1 : pathB.isDescendantOf(pathA.path) ? -1 : 0;
		});

		const { path, content: targetNode } = byNodes.shift() as StorageNodeInfo;

		const pathInfo = PathInfo.get(path);

		const result = targetNode;

		const objectToArray = (obj: Record<string, any>) => {
			// Convert object value to array
			const arr = [] as any[];
			Object.keys(obj).forEach((key) => {
				const index = parseInt(key);
				arr[index] = obj[index];
			});
			return arr;
		};

		if (targetNode.type === VALUE_TYPES.ARRAY) {
			result.value = objectToArray(result.value);
		}

		if ([VALUE_TYPES.OBJECT, VALUE_TYPES.ARRAY].includes(targetNode.type)) {
			const targetPathKeys = PathInfo.getPathKeys(path);
			const value = targetNode.value;

			for (let { path: otherPath, content: otherNode } of byNodes) {
				const pathKeys = PathInfo.getPathKeys(otherPath);
				const trailKeys = pathKeys.slice(targetPathKeys.length);
				let parent = value;

				for (let j = 0; j < trailKeys.length; j++) {
					assert(typeof parent === "object", "parent must be an object/array to have children!!");
					const key = trailKeys[j];
					const isLast = j === trailKeys.length - 1;
					const nodeType = isLast ? otherNode.type : typeof trailKeys[j + 1] === "number" ? VALUE_TYPES.ARRAY : VALUE_TYPES.OBJECT;
					let nodeValue: any;

					if (!isLast) {
						nodeValue = nodeType === VALUE_TYPES.OBJECT ? {} : [];
					} else {
						nodeValue = otherNode.value;
						if (nodeType === VALUE_TYPES.ARRAY) {
							nodeValue = objectToArray(nodeValue);
						}
					}

					if (key in parent) {
						const mergePossible = typeof parent[key] === typeof nodeValue && [VALUE_TYPES.OBJECT, VALUE_TYPES.ARRAY].includes(nodeType);
						if (mergePossible) {
							Object.keys(nodeValue).forEach((childKey) => {
								parent[key][childKey] = nodeValue[childKey];
							});
						}
					} else {
						parent[key] = nodeValue;
					}
					parent = parent[key];
				}
			}
		}

		return {
			path: pathInfo.path,
			content: result,
		};
	}

	static toJson(nodes: StorageNodeInfo[] | StorageNodeInfo, options: Partial<NodeSettings> = {}): StorageNodeInfo {
		return new Node(options).toJson(nodes);
	}
}
