import { SimpleCacheOptions } from "../Types";
/**
 * Implementação simples de cache que mantém valores imutáveis na memória por um tempo limitado.
 * A imutabilidade é garantida clonando os valores armazenados e recuperados. Para alterar um valor em cache, ele terá que ser `set` novamente com o novo valor.
 */
export declare class SimpleCache<K, V> {
    options: SimpleCacheOptions;
    private cache;
    enabled: boolean;
    get size(): number;
    constructor(options: number | Partial<SimpleCacheOptions>);
    has(key: K): boolean;
    get(key: K): V | null;
    set(key: K, value: V): void;
    remove(key: K): void;
    cleanUp(): void;
    keys(): K[];
    values(): V[];
    forEach(callback: (value: V, key: K, cache: SimpleCache<K, V>) => void): void;
}
//# sourceMappingURL=SimpleCache.d.ts.map