import { ISchemaCheckResult, IType } from "../Types/schema";
export declare class SchemaDefinition {
    readonly handling: {
        warnOnly: boolean;
        warnCallback?: (message: string) => void;
    };
    readonly source: string | object;
    readonly text: string;
    readonly type: IType;
    constructor(definition: string | object, handling?: {
        warnOnly: boolean;
        warnCallback?: (message: string) => void;
    });
    check(path: string, value: any, partial: boolean, trailKeys?: Array<string | number>): ISchemaCheckResult;
}
//# sourceMappingURL=Schema.d.ts.map