import { CleanupFunction, CreateFunction, IObservableLike, IObserver, ISubscription, SubscribeFunction } from "../Types";

/**
 * rxjs is an optional dependency that only needs installing when any of AceBase's observe methods are used.
 * If for some reason rxjs is not available (eg in test suite), we can provide a shim. This class is used when
 * `db.setObservable("shim")` is called
 */
export default class SimpleObservable<T> implements IObservableLike<T> {
	private _active = false;
	private _create: CreateFunction<T>;
	private _cleanup!: CleanupFunction;
	private _subscribers: SubscribeFunction<T>[] = [];
	constructor(create: CreateFunction<T>) {
		this._create = create;
	}
	subscribe(subscriber: SubscribeFunction<T>) {
		if (!this._active) {
			const next = (value: T) => {
				// emit value to all subscribers
				this._subscribers.forEach((s) => {
					try {
						s(value);
					} catch (err) {
						console.error("Error in subscriber callback:", err);
					}
				});
			};
			const observer: IObserver<T> = { next };
			this._cleanup = this._create(observer);
			this._active = true;
		}
		this._subscribers.push(subscriber);
		const unsubscribe = () => {
			this._subscribers.splice(this._subscribers.indexOf(subscriber), 1);
			if (this._subscribers.length === 0) {
				this._active = false;
				this._cleanup();
			}
		};
		const subscription: ISubscription = {
			unsubscribe,
		};
		return subscription;
	}
}
