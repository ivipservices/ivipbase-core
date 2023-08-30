import { SimpleEventEmitterProperty } from "../Types";
declare const _subscriptions: unique symbol;
declare const _oneTimeEvents: unique symbol;
export default class SimpleEventEmitter {
    private [_subscriptions];
    private [_oneTimeEvents];
    constructor();
    on<T = any>(event: string, callback: (data: T) => void): SimpleEventEmitterProperty;
    off<T = any>(event: string, callback?: (data: T) => void): this;
    once<T = any>(event: string, callback?: (data: T) => void): Promise<T>;
    emit(event: string, data?: any): this;
    emitOnce(event: string, data?: any): this;
    pipe(event: string, eventEmitter: SimpleEventEmitter): SimpleEventEmitterProperty;
    pipeOnce(event: string, eventEmitter: SimpleEventEmitter): Promise<any>;
}
export {};
//# sourceMappingURL=SimpleEventEmitter.d.ts.map