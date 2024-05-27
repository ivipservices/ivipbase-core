import { SimpleCacheOptions } from "../Types";
import { cloneObject } from "./Utils";

const calculateExpiryTime = (expirySeconds: number) => (expirySeconds > 0 ? Date.now() + expirySeconds * 1000 : Infinity);

/**
 * Implementação simples de cache que mantém valores imutáveis na memória por um tempo limitado.
 * A imutabilidade é garantida clonando os valores armazenados e recuperados. Para alterar um valor em cache, ele terá que ser `set` novamente com o novo valor.
 */
export class SimpleCache<K, V> {
	options: SimpleCacheOptions;
	private cache: Map<K, { value: V; added: number; expires: number; accessed: number }>;
	enabled = true;
	get size() {
		return this.cache.size;
	}

	constructor(options: number | Partial<SimpleCacheOptions>) {
		if (typeof options === "number") {
			// Assinatura antiga: apenas expirySeconds fornecido
			options = { expirySeconds: options };
		}
		options.cloneValues = options.cloneValues !== false;
		if (typeof options.expirySeconds !== "number" && typeof options.maxEntries !== "number") {
			throw new Error("Either expirySeconds or maxEntries must be specified");
		}
		this.options = { expirySeconds: 15, ...options };
		this.cache = new Map();

		// Limpeza a cada minuto
		const interval = setInterval(() => {
			this.cleanUp();
		}, 60 * 1000);
		interval.unref?.();
	}
	has(key: K) {
		if (!this.enabled) {
			return false;
		}
		return this.cache.has(key);
	}
	get(key: K): V | null {
		if (!this.enabled) {
			return null;
		}
		const entry = this.cache.get(key);
		if (!entry) {
			return null;
		} // if (!entry || entry.expires <= Date.now()) { return null; }
		entry.expires = calculateExpiryTime(this.options.expirySeconds);
		entry.accessed = Date.now();
		return this.options.cloneValues ? (cloneObject(entry.value) as V) : entry.value;
	}
	set(key: K, value: V) {
		if (typeof this.options.maxEntries === "number" && this.options.maxEntries > 0 && this.cache.size >= this.options.maxEntries && !this.cache.has(key)) {
			// console.warn(`* cache limit ${this.options.maxEntries} reached: ${this.cache.size}`);

			// Remove um item expirado ou aquele que foi acessado há mais tempo
			let oldest: { key: K; accessed: number } | null = null;
			const now = Date.now();
			for (const [key, entry] of this.cache.entries()) {
				if (entry.expires <= now) {
					// Found an expired item. Remove it now and stop
					this.cache.delete(key);
					oldest = null;
					break;
				}
				if (!oldest || entry.accessed < oldest.accessed) {
					oldest = { key, accessed: entry.accessed };
				}
			}
			if (oldest !== null) {
				this.cache.delete(oldest.key);
			}
		}
		this.cache.set(key, { value: this.options.cloneValues ? (cloneObject(value) as V) : value, added: Date.now(), accessed: Date.now(), expires: calculateExpiryTime(this.options.expirySeconds) });
	}
	remove(key: K) {
		this.cache.delete(key);
	}
	cleanUp() {
		const now = Date.now();
		this.cache.forEach((entry, key) => {
			if (entry.expires <= now) {
				this.cache.delete(key);
			}
		});
	}
	keys() {
		return Array.from(this.cache.keys());
	}
	values() {
		return Array.from(this.cache.values()).map((v) => v.value);
	}
	forEach(callback: (value: V, key: K, cache: SimpleCache<K, V>) => void) {
		this.cache.forEach((entry, key) => {
			callback(entry.value, key, this);
		});
	}
}
