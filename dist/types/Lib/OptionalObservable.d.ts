export type { Observable } from "rxjs";
export declare function getObservable<T = any>(): {
    new (subscribe?: ((this: import("rxjs").Observable<T>, subscriber: import("rxjs").Subscriber<T>) => import("rxjs").TeardownLogic) | undefined): import("rxjs").Observable<T>;
    create: (...args: any[]) => any;
};
export declare function setObservable(Observable: any): void;
//# sourceMappingURL=OptionalObservable.d.ts.map