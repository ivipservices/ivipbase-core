export interface IType {
	typeOf: string; // typeof
	// eslint-disable-next-line @typescript-eslint/ban-types
	instanceOf?: Function; // eg: instanceof 'Array'
	value?: string | number | boolean | bigint | null;
	genericTypes?: IType[];
	children?: IProperty[];
	matches?: RegExp; // enforces regular expression checks on values
}

export interface IProperty {
	name: string;
	optional: boolean;
	wildcard: boolean;
	types: IType[];
}

export interface ISchemaCheckResult {
	ok: boolean;
	reason?: string;
	warning?: string;
}
