import SimpleEventEmitter from "../Lib/SimpleEventEmitter";
import { EventSubscriptionCallback, EventSubscriptionSettings, StreamReadFunction, StreamWriteFunction } from "../Types";
import { Query, QueryOptions, ReflectionNodeInfo, ReflectionType, SchemaInfo, ValueChange, ValueMutation } from "../Types/LocalStorage";

class NotImplementedError extends Error {
	constructor(name: string) {
		super(`${name} is not implemented`);
	}
}

export default abstract class LocalStorage extends SimpleEventEmitter {
	constructor() {
		super();
	}

	/**
	 * Provides statistics
	 * @param options
	 */
	stats(options?: any): Promise<any> {
		throw new NotImplementedError("stats");
	}

	/**
	 * @param path
	 * @param event event to subscribe to ("value", "child_added" etc)
	 * @param callback callback function
	 */
	subscribe(path: string, event: string, callback: EventSubscriptionCallback, settings?: EventSubscriptionSettings): void | Promise<void> {
		throw new NotImplementedError("subscribe");
	}

	unsubscribe(path: string, event?: string, callback?: EventSubscriptionCallback): void | Promise<void> {
		throw new NotImplementedError("unsubscribe");
	}

	update(path: string, updates: any, options?: any): Promise<{ cursor?: string }> {
		throw new NotImplementedError("update");
	}

	set(path: string, value: any, options?: any): Promise<{ cursor?: string }> {
		throw new NotImplementedError("set");
	}

	get(path: string, options?: any): Promise<{ value: any; context: any; cursor?: string }> {
		throw new NotImplementedError("get");
	}

	transaction(path: string, callback: (val: any) => any, options?: any): Promise<{ cursor?: string }> {
		throw new NotImplementedError("transaction");
	}

	exists(path: string): Promise<boolean> {
		throw new NotImplementedError("exists");
	}

	query(
		path: string,
		query: Query,
		options?: QueryOptions,
	): Promise<{
		results: Array<{ path: string; val: any }> | string[];
		context: any;
		stop(): Promise<void>;
	}> {
		throw new NotImplementedError("query");
	}

	reflect(path: string, type: "children", args: any): Promise<ReflectionNodeInfo>;
	reflect(path: string, type: "info", args: any): Promise<ReflectionNodeInfo>;
	reflect(path: string, type: ReflectionType, args: any): Promise<any>;
	reflect(path: string, type: ReflectionType, args: any): Promise<any> {
		throw new NotImplementedError("reflect");
	}

	export(path: string, write: StreamWriteFunction, options: any): Promise<void> {
		throw new NotImplementedError("export");
	}

	import(path: string, read: StreamReadFunction, options: any): Promise<void> {
		throw new NotImplementedError("import");
	}

	setSchema(path: string, schema: Record<string, any> | string, warnOnly?: boolean): Promise<void> {
		throw new NotImplementedError("setSchema");
	}

	getSchema(path: string): Promise<SchemaInfo> {
		throw new NotImplementedError("getSchema");
	}

	getSchemas(): Promise<SchemaInfo[]> {
		throw new NotImplementedError("getSchemas");
	}

	validateSchema(path: string, value: any, isUpdate: boolean): Promise<{ ok: boolean; reason?: string; warning?: string }> {
		throw new NotImplementedError("validateSchema");
	}

	getMutations(
		filter: ({ cursor: string } | { timestamp: number }) & { path?: string; for?: Array<{ path: string; events: string[] }> },
	): Promise<{ used_cursor: string | null; new_cursor: string; mutations: ValueMutation[] }> {
		throw new NotImplementedError("getMutations");
	}

	getChanges(
		filter: ({ cursor: string } | { timestamp: number }) & { path?: string; for?: Array<{ path: string; events: string[] }> },
	): Promise<{ used_cursor: string | null; new_cursor: string; changes: ValueChange[] }> {
		throw new NotImplementedError("getChanges");
	}
}
