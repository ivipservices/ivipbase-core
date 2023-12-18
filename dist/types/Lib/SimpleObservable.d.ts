import { CreateFunction, IObservableLike, ISubscription, SubscribeFunction } from "../Types";
/**
 * rxjs is an optional dependency that only needs installing when any of IvipBase's observe methods are used.
 * If for some reason rxjs is not available (eg in test suite), we can provide a shim. This class is used when
 * `db.setObservable("shim")` is called
 */
export default class SimpleObservable<T> implements IObservableLike<T> {
    private _active;
    private _create;
    private _cleanup;
    private _subscribers;
    constructor(create: CreateFunction<T>);
    subscribe(subscriber: SubscribeFunction<T>): ISubscription;
}
//# sourceMappingURL=SimpleObservable.d.ts.map