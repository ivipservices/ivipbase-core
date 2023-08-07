import { DataSnapshot } from "src/DataBase/data/snapshot";
import { PathReference } from "./PathInfo";
import { PartialArray } from "./PartialArray";
import { ObjectProperty, TypedArray, ValueCompareResult } from "src/Types";

const isTypedArray = (val: any) =>
	typeof val === "object" && ["ArrayBuffer", "Buffer", "Uint8Array", "Uint16Array", "Uint32Array", "Int8Array", "Int16Array", "Int32Array"].includes(val.constructor.name);
// CONSIDER: updating isTypedArray to: const isTypedArray = val => typeof val === 'object' && 'buffer' in val && 'byteOffset' in val && 'byteLength' in val;

export class ObjectDifferences {
	constructor(public added: ObjectProperty[], public removed: ObjectProperty[], public changed: Array<{ key: ObjectProperty; change: ValueCompareResult }>) {}
	forChild(key: ObjectProperty): ValueCompareResult {
		if (this.added.includes(key)) {
			return "added";
		}
		if (this.removed.includes(key)) {
			return "removed";
		}
		const changed = this.changed.find((ch) => ch.key === key);
		return changed ? changed.change : "identical";
	}
}

export function cloneObject(original: any, stack: any[] = []) {
	if (original?.constructor?.name === "DataSnapshot") {
		throw new TypeError(`Object to clone is a DataSnapshot (path "${(original as DataSnapshot).ref.path}")`);
	}

	const checkAndFixTypedArray = (obj: any) => {
		if (
			obj !== null &&
			typeof obj === "object" &&
			typeof obj.constructor === "function" &&
			typeof obj.constructor.name === "string" &&
			["Buffer", "Uint8Array", "Int8Array", "Uint16Array", "Int16Array", "Uint32Array", "Int32Array", "BigUint64Array", "BigInt64Array"].includes(obj.constructor.name)
		) {
			// FIX for typed array being converted to objects with numeric properties:
			// Convert Buffer or TypedArray to ArrayBuffer
			obj = obj.buffer.slice(obj.byteOffset, obj.byteOffset + obj.byteLength);
		}
		return obj;
	};
	original = checkAndFixTypedArray(original);

	if (typeof original !== "object" || original === null || original instanceof Date || original instanceof ArrayBuffer || original instanceof PathReference || original instanceof RegExp) {
		return original;
	}

	const cloneValue = (val: any) => {
		if (stack.indexOf(val) >= 0) {
			throw new ReferenceError("object contains a circular reference");
		}
		val = checkAndFixTypedArray(val);
		if (val === null || val instanceof Date || val instanceof ArrayBuffer || val instanceof PathReference || val instanceof RegExp) {
			// || val instanceof ID
			return val;
		} else if (typeof val === "object") {
			stack.push(val);
			val = cloneObject(val, stack);
			stack.pop();
			return val;
		} else {
			return val; // Anything other can just be copied
		}
	};
	if (typeof stack === "undefined") {
		stack = [original];
	}
	const clone: PartialArray | any[] | Record<string, any> = original instanceof Array ? [] : original instanceof PartialArray ? new PartialArray() : {};
	Object.keys(original).forEach((key) => {
		const val = original[key];
		if (typeof val === "function") {
			return; // skip functions
		}
		(clone as any)[key] = cloneValue(val);
	});
	return clone;
}

export function valuesAreEqual(val1: any, val2: any): boolean {
	if (val1 === val2) {
		return true;
	}
	if (typeof val1 !== typeof val2) {
		return false;
	}
	if (typeof val1 === "object" || typeof val2 === "object") {
		if (val1 === null || val2 === null) {
			return false;
		}
		if (val1 instanceof PathReference || val2 instanceof PathReference) {
			return val1 instanceof PathReference && val2 instanceof PathReference && val1.path === val2.path;
		}
		if (val1 instanceof Date || val2 instanceof Date) {
			return val1 instanceof Date && val2 instanceof Date && val1.getTime() === val2.getTime();
		}
		if (val1 instanceof Array || val2 instanceof Array) {
			return val1 instanceof Array && val2 instanceof Array && val1.length === val2.length && val1.every((item, i) => valuesAreEqual(val1[i], val2[i]));
		}
		if (isTypedArray(val1) || isTypedArray(val2)) {
			if (!isTypedArray(val1) || !isTypedArray(val2) || (val1 as ArrayBuffer).byteLength === (val2 as ArrayBuffer).byteLength) {
				return false;
			}
			const typed1 = val1 instanceof ArrayBuffer ? new Uint8Array(val1) : new Uint8Array((val1 as TypedArray).buffer, (val1 as TypedArray).byteOffset, (val1 as TypedArray).byteLength),
				typed2 = val2 instanceof ArrayBuffer ? new Uint8Array(val2) : new Uint8Array((val2 as TypedArray).buffer, (val2 as TypedArray).byteOffset, (val2 as TypedArray).byteLength);
			return typed1.every((val, i) => typed2[i] === val);
		}
		const keys1 = Object.keys(val1),
			keys2 = Object.keys(val2);
		return keys1.length === keys2.length && keys1.every((key) => keys2.includes(key)) && keys1.every((key) => valuesAreEqual(val1[key], val2[key]));
	}
	return false;
}

export function compareValues(oldVal: any, newVal: any, sortedResults = false): ValueCompareResult {
	const voids = [undefined, null] as [undefined, null];
	if (oldVal === newVal) {
		return "identical";
	} else if (voids.indexOf(oldVal) >= 0 && voids.indexOf(newVal) < 0) {
		return "added";
	} else if (voids.indexOf(oldVal) < 0 && voids.indexOf(newVal) >= 0) {
		return "removed";
	} else if (typeof oldVal !== typeof newVal) {
		return "changed";
	} else if (isTypedArray(oldVal) || isTypedArray(newVal)) {
		// One or both values are typed arrays.
		if (!isTypedArray(oldVal) || !isTypedArray(newVal)) {
			return "changed";
		}
		// Both are typed. Compare lengths and byte content of typed arrays
		const typed1 =
			oldVal instanceof Uint8Array
				? oldVal
				: oldVal instanceof ArrayBuffer
				? new Uint8Array(oldVal)
				: new Uint8Array((oldVal as TypedArray).buffer, (oldVal as TypedArray).byteOffset, (oldVal as TypedArray).byteLength);
		const typed2 =
			newVal instanceof Uint8Array
				? newVal
				: newVal instanceof ArrayBuffer
				? new Uint8Array(newVal)
				: new Uint8Array((newVal as TypedArray).buffer, (newVal as TypedArray).byteOffset, (newVal as TypedArray).byteLength);
		return typed1.byteLength === typed2.byteLength && typed1.every((val, i) => typed2[i] === val) ? "identical" : "changed";
	} else if (oldVal instanceof Date || newVal instanceof Date) {
		return oldVal instanceof Date && newVal instanceof Date && oldVal.getTime() === newVal.getTime() ? "identical" : "changed";
	} else if (oldVal instanceof PathReference || newVal instanceof PathReference) {
		return oldVal instanceof PathReference && newVal instanceof PathReference && oldVal.path === newVal.path ? "identical" : "changed";
	} else if (typeof oldVal === "object") {
		// Do key-by-key comparison of objects
		const isArray = oldVal instanceof Array;
		const getKeys = (obj: any) => {
			let keys: ObjectProperty[] = Object.keys(obj).filter((key) => !voids.includes(obj[key]));
			if (isArray) {
				keys = keys.map((v: any) => parseInt(v));
			}
			return keys;
		};
		const oldKeys = getKeys(oldVal);
		const newKeys = getKeys(newVal);
		const removedKeys = oldKeys.filter((key) => !newKeys.includes(key));
		const addedKeys = newKeys.filter((key) => !oldKeys.includes(key));
		const changedKeys = newKeys.reduce((changed, key) => {
			if (oldKeys.includes(key)) {
				const val1 = oldVal[key];
				const val2 = newVal[key];
				const c = compareValues(val1, val2);
				if (c !== "identical") {
					changed.push({ key, change: c });
				}
			}
			return changed;
		}, [] as Array<{ key: ObjectProperty; change: ValueCompareResult }>);

		if (addedKeys.length === 0 && removedKeys.length === 0 && changedKeys.length === 0) {
			return "identical";
		} else {
			return new ObjectDifferences(addedKeys, removedKeys, sortedResults ? changedKeys.sort((a, b) => (a.key < b.key ? -1 : 1)) : changedKeys);
		}
	}
	return "changed";
}

export function getMutations(oldVal: any, newVal: any, sortedResults = false): Array<{ target: ObjectProperty[]; prev: any; val: any }> {
	const process = (target: ObjectProperty[], compareResult: ValueCompareResult, prev: any, val: any) => {
		switch (compareResult) {
			case "identical":
				return [];
			case "changed":
				return [{ target, prev, val }];
			case "added":
				return [{ target, prev: null, val }];
			case "removed":
				return [{ target, prev, val: null }];
			default: {
				let changes = [] as Array<{ target: ObjectProperty[]; prev: any; val: any }>;
				compareResult.added.forEach((key) => changes.push({ target: target.concat(key), prev: null, val: val[key] }));
				compareResult.removed.forEach((key) => changes.push({ target: target.concat(key), prev: prev[key], val: null }));
				compareResult.changed.forEach((item) => {
					const childChanges = process(target.concat(item.key), item.change, prev[item.key], val[item.key]);
					changes = changes.concat(childChanges);
				});
				return changes;
			}
		}
	};
	const compareResult = compareValues(oldVal, newVal, sortedResults);
	return process([], compareResult, oldVal, newVal);
}

export function getGlobalObject(): any {
	if (typeof globalThis !== "undefined") {
		return globalThis;
	}
	if (typeof global !== "undefined") {
		return global;
	}
	if (typeof window !== "undefined") {
		return window;
	}
	if (typeof self !== "undefined") {
		return self;
	}
	return (
		(function (): any {
			return;
		})() ?? Function("return this")()
	);
}
