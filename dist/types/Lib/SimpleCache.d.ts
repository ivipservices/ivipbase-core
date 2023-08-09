import { SimpleCacheOptions } from "src/Types";
/**
 * Simple cache implementation that retains immutable values in memory for a limited time.
 * Immutability is enforced by cloning the stored and retrieved values. To change a cached value, it will have to be `set` again with the new value.
 */
export declare class SimpleCache<K, V> {
    options: SimpleCacheOptions;
    private cache;
    enabled: boolean;
    get size(): number;
    private defaultExpirySeconds;
    constructor(options: number | SimpleCacheOptions);
    has(key: K): boolean;
    get(key: K): V | null;
    set(key: K, value: V): void;
    remove(key: K): void;
    cleanUp(): void;
}
//# sourceMappingURL=SimpleCache.d.ts.map