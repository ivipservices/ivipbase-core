export interface QueryFilter {
	key: string | number;
	op: string;
	compare: any;
}

export interface QueryOrder {
	key: string;
	ascending: boolean;
}

export interface Query {
	filters: QueryFilter[];

	/**
	 * number of results to skip, useful for paging
	 */
	skip: number;

	/**
	 * max number of results to return
	 */
	take: number;

	/**
	 * sort order
	 */
	order: QueryOrder[];
}

export interface QueryOptions {
	/**
	 * whether to return matching data, or paths to matching nodes only
	 * @default false
	 */
	snapshots?: boolean;

	/**
	 * when using snapshots, keys or relative paths to include in result data
	 */
	include?: (string | number)[];

	/**
	 * when using snapshots, keys or relative paths to exclude from result data
	 */
	exclude?: (string | number)[];

	/**
	 * when using snapshots, whether to include child objects in result data
	 * @default true
	 */
	child_objects?: boolean;

	/**
	 * Whether to allow cached results
	 * @deprecated Use `cache_mode` instead */
	allow_cache?: boolean;

	/** How to handle results from cache */
	cache_mode?: "allow" | "bypass" | "force";

	/**
	 * callback function for events
	 */
	eventHandler?: (event: { name: "add" | "change" | "remove"; path: string; value: any } | { name: string; [key: string]: any }) => boolean | void;

	/**
	 * monitor changes
	 * @default false
	 */
	monitor?:
		| boolean
		| {
				/**
				 * monitor new matches (either because they were added, or changed and now match the query)
				 */
				add?: boolean;

				/**
				 * monitor changed children that still match this query
				 */
				change?: boolean;

				/**
				 * monitor children that don't match this query anymore
				 */
				remove?: boolean;
		  };
}

export type ReflectionType = "info" | "children";

export interface ReflectionNodeInfo {
	key: string | number;
	exists: boolean;
	type: "unknown" | "object" | "array" | "number" | "boolean" | "string" | "date" | "bigint" | "binary" | "reference"; // future: |'document'
	/** only present for small values (number, boolean, date), small strings & binaries, and empty objects and arrays */
	value?: any;
	/** Physical storage location details used by the target database type */
	address?: any;
	/** children are included for the target path of the reflection request */
	children?:
		| { count: number }
		| {
				more: boolean;
				list: Pick<ReflectionNodeInfo, "key" | "type" | "value" | "address" | "access">[];
		  };
	/** access rights if impersonation is used in reflection request */
	access?: {
		read: boolean;
		write: boolean;
	};
}

export interface ReflectionChildrenInfo {
	more: boolean;
	list: Pick<ReflectionNodeInfo, "key" | "type" | "value" | "address">[];
}

export interface SchemaInfo {
	path: string;
	schema: Record<string, any> | string;
	text: string;
}

// export type GetMutationsResult = {
//     used_cursor: string, new_cursor: string,
//     mutations: Array<{ path: string, type: 'set'|'update', previous: any, value: any, context: any }> };

/**
 * Uncompressed mutation: a single database operation of `type` `"set"` (overwrite) or `"update"` (merge) on `mutations.path`
 * caused the value of `path` to be mutated to `value`
 */
export type ValueMutation = {
	/** path the mutation had effect on */
	path: string;
	/** database operation used */
	type: "set" | "update";
	/** new effective value of the node at current `path` */
	value: unknown;
	/** context used when database operation executed */
	context: unknown;
	/** id (cursor) of the transaction log item */
	id: string;
	/** timestamp of the mutation */
	timestamp: number;
	/** actual changes caused by the database operation of `type` on `mutations.path` at the time of execution */
	changes: {
		/** path the database operation was executed on, used as root of all changes in `list` */
		path: string;
		/** list of all changed values relative to `path` */
		list: Array<{
			/** keys trail to mutated path, relative to `path` */
			target: Array<string | number>;
			/** new value stored at target */
			val: unknown;
			/** prev value stored at target */
			prev: unknown;
		}>;
	};
};
/**
 * Compressed mutation: one or more database operations caused the value of the node at `path` to effectively be mutated
 * from `previous` to `value` using database operation logic of `type` `"set"` (overwrite) or `"update"` (merge)
 */
export type ValueChange = { path: string; type: "set" | "update"; previous: any; value: any; context: any };
