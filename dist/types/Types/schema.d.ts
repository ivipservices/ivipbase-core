export interface IType {
    typeOf: string;
    instanceOf?: Function;
    value?: string | number | boolean | bigint | null;
    genericTypes?: IType[];
    children?: IProperty[];
    matches?: RegExp;
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
//# sourceMappingURL=schema.d.ts.map