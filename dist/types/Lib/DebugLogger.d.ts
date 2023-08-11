import { LoggingFunction, LoggingLevel } from "../Types";
export default class DebugLogger {
    level: LoggingLevel;
    private prefix;
    verbose: LoggingFunction;
    log: LoggingFunction;
    warn: LoggingFunction;
    error: LoggingFunction;
    write: (text: string) => void;
    constructor(level?: LoggingLevel, prefix?: string);
    setLevel(level: LoggingLevel): void;
}
//# sourceMappingURL=DebugLogger.d.ts.map