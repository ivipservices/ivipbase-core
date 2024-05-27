"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleCache = void 0;
const Utils_1 = require("./Utils");
const calculateExpiryTime = (expirySeconds) => (expirySeconds > 0 ? Date.now() + expirySeconds * 1000 : Infinity);
/**
 * Implementação simples de cache que mantém valores imutáveis na memória por um tempo limitado.
 * A imutabilidade é garantida clonando os valores armazenados e recuperados. Para alterar um valor em cache, ele terá que ser `set` novamente com o novo valor.
 */
class SimpleCache {
    get size() {
        return this.cache.size;
    }
    constructor(options) {
        var _a;
        this.enabled = true;
        if (typeof options === "number") {
            // Assinatura antiga: apenas expirySeconds fornecido
            options = { expirySeconds: options };
        }
        options.cloneValues = options.cloneValues !== false;
        if (typeof options.expirySeconds !== "number" && typeof options.maxEntries !== "number") {
            throw new Error("Either expirySeconds or maxEntries must be specified");
        }
        this.options = Object.assign({ expirySeconds: 15 }, options);
        this.cache = new Map();
        // Limpeza a cada minuto
        const interval = setInterval(() => {
            this.cleanUp();
        }, 60 * 1000);
        (_a = interval.unref) === null || _a === void 0 ? void 0 : _a.call(interval);
    }
    has(key) {
        if (!this.enabled) {
            return false;
        }
        return this.cache.has(key);
    }
    get(key) {
        if (!this.enabled) {
            return null;
        }
        const entry = this.cache.get(key);
        if (!entry) {
            return null;
        } // if (!entry || entry.expires <= Date.now()) { return null; }
        entry.expires = calculateExpiryTime(this.options.expirySeconds);
        entry.accessed = Date.now();
        return this.options.cloneValues ? (0, Utils_1.cloneObject)(entry.value) : entry.value;
    }
    set(key, value) {
        if (typeof this.options.maxEntries === "number" && this.options.maxEntries > 0 && this.cache.size >= this.options.maxEntries && !this.cache.has(key)) {
            // console.warn(`* cache limit ${this.options.maxEntries} reached: ${this.cache.size}`);
            // Remove um item expirado ou aquele que foi acessado há mais tempo
            let oldest = null;
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
        this.cache.set(key, { value: this.options.cloneValues ? (0, Utils_1.cloneObject)(value) : value, added: Date.now(), accessed: Date.now(), expires: calculateExpiryTime(this.options.expirySeconds) });
    }
    remove(key) {
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
    forEach(callback) {
        this.cache.forEach((entry, key) => {
            callback(entry.value, key, this);
        });
    }
}
exports.SimpleCache = SimpleCache;
//# sourceMappingURL=SimpleCache.js.map