import PathInfo from "../Lib/PathInfo.js";
function getChild(snapshot, path, previous = false) {
    if (!snapshot.exists()) {
        return null;
    }
    let child = previous ? snapshot.previous() : snapshot.val();
    if (typeof path === "number") {
        return child[path];
    }
    PathInfo.getPathKeys(path).every((key) => {
        child = child[key];
        return typeof child !== "undefined";
    });
    return child || null;
}
function getChildren(snapshot) {
    if (!snapshot.exists()) {
        return [];
    }
    const value = snapshot.val();
    if (value instanceof Array) {
        return new Array(value.length).map((v, i) => i);
    }
    if (typeof value === "object") {
        return Object.keys(value);
    }
    return [];
}
export class DataSnapshot {
    /**
     * Indica se o nó existe no banco de dados
     */
    exists() {
        return false;
    }
    /**
     * Cria uma nova instância do DataSnapshot
     */
    constructor(ref, value, isRemoved = false, prevValue, context) {
        this.ref = ref;
        this.val = () => {
            return value;
        };
        this.previous = () => {
            return prevValue;
        };
        this.exists = () => {
            if (isRemoved) {
                return false;
            }
            return value !== null && typeof value !== "undefined";
        };
        this.context = () => {
            return context || {};
        };
    }
    /**
     * Cria uma instância `DataSnapshot`
     * @internal (para uso interno)
     */
    static for(ref, value) {
        return new DataSnapshot(ref, value);
    }
    child(path) {
        // Create new snapshot for child data
        const val = getChild(this, path, false);
        const prev = getChild(this, path, true);
        return new DataSnapshot(this.ref.child(path), val, false, prev);
    }
    /**
     * Verifica se o valor do instantâneo tem um filho com a chave ou caminho fornecido
     * @param path chave filho ou caminho
     */
    hasChild(path) {
        return getChild(this, path) !== null;
    }
    /**
     * Indica se o valor do instantâneo tem algum nó filho
     */
    hasChildren() {
        return getChildren(this).length > 0;
    }
    /**
     * O número de nós filhos neste instantâneo
     */
    numChildren() {
        return getChildren(this).length;
    }
    /**
     * Executa uma função de retorno de chamada para cada nó filho neste instantâneo até que o retorno de chamada retorne falso
     * @param callback Função de retorno de chamada com um instantâneo de cada nó filho neste instantâneo.
     * Deve retornar um valor booleano que indica se a iteração deve continuar ou não.
     */
    forEach(callback) {
        const value = this.val() ?? {};
        const prev = this.previous() ?? {};
        return getChildren(this).every((key) => {
            const snap = new DataSnapshot(this.ref.child(key), value[key], false, prev[key]);
            return callback(snap);
        });
    }
    /**
     * A chave do caminho do nó
     */
    get key() {
        return this.ref.key;
    }
}
export class MutationsDataSnapshot extends DataSnapshot {
    constructor(ref, mutations, context) {
        super(ref, mutations, false, undefined, context);
        /**
         * Não use isso para obter valores anteriores de nós mutados.
         * Use as propriedades `.previous` nas snapshots individuais de cada filho.
         * @throws Lança um erro se você o utilizar.
         */
        this.previous = () => {
            throw new Error("Iterate values to get previous values for each mutation");
        };
        this.val = (warn = true) => {
            if (warn) {
                console.warn("Unless you know what you are doing, it is best not to use the value of a mutations snapshot directly. Use child methods and forEach to iterate the mutations instead");
            }
            return mutations;
        };
    }
    /**
     * Executa uma função de retorno de chamada para cada mutação nesta snapshot até que a função de retorno de chamada retorne false.
     * @param callback Função chamada com uma snapshot de cada mutação nesta snapshot. Deve retornar um valor booleano que indica se deve continuar a iteração ou não.
     * @returns Retorna se cada filho foi iterado.
     */
    forEach(callback) {
        const mutations = this.val(false);
        return mutations.every((mutation) => {
            const ref = mutation.target.reduce((ref, key) => ref.child(key), this.ref);
            const snap = new DataSnapshot(ref, mutation.val, false, mutation.prev);
            return callback(snap);
        });
    }
    child(index) {
        if (typeof index !== "number") {
            throw new Error("child index must be a number");
        }
        const mutation = this.val(false)[index];
        const ref = mutation.target.reduce((ref, key) => ref.child(key), this.ref);
        return new DataSnapshot(ref, mutation.val, false, mutation.prev);
    }
}
//# sourceMappingURL=snapshot.js.map