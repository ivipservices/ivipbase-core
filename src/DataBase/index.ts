import SimpleEventEmitter from "../Lib/SimpleEventEmitter";
import { DataReference, DataReferenceQuery } from "./data/reference";
import LocalStorage from "../LocalStorage";
import { LoggingLevel } from "../Types";
import DebugLogger from "../Lib/DebugLogger";
import TypeMappings from "../Lib/TypeMappings";

export class DataBaseSettings {
	/**
	 * What level to use for console logging.
	 * @default 'log'
	 */
	logLevel: LoggingLevel = "log";

	/**
	 * Whether to use colors in the console logs output
	 * @default true
	 */
	logColors = true;

	/**
	 * @internal (for internal use)
	 */
	info = "realtime database";

	constructor(options: Partial<DataBaseSettings>) {
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

export abstract class DataBase extends SimpleEventEmitter {
	protected _ready = false;

	storage!: LocalStorage;

	/**
	 * @internal (for internal use)
	 */
	debug: DebugLogger;

	/**
	 * Type mappings
	 */
	types: TypeMappings;

	readonly name: string;

	constructor(dbname: string, options: Partial<DataBaseSettings> = {}) {
		super();
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
	async ready(callback?: () => void) {
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
	ref<T = any>(path: string): DataReference<T> {
		return new DataReference(this, path);
	}

	/**
	 * Get a reference to the root database node
	 * @returns reference to root node
	 */
	get root(): DataReference {
		return this.ref("");
	}

	/**
	 * Creates a query on the requested node
	 * @param path
	 * @returns query for the requested node
	 */
	query(path: string): DataReferenceQuery {
		const ref = new DataReference(this, path);
		return new DataReferenceQuery(ref);
	}

	get schema() {
		return {
			get: (path: string) => {
				return this.storage.getSchema(path);
			},
			set: (path: string, schema: Record<string, unknown> | string, warnOnly = false) => {
				return this.storage.setSchema(path, schema, warnOnly);
			},
			all: () => {
				return this.storage.getSchemas();
			},
			check: (path: string, value: unknown, isUpdate: boolean) => {
				return this.storage.validateSchema(path, value, isUpdate);
			},
		};
	}
}

export default DataBase;
