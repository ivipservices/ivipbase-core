import type { DataReference } from './data-reference';
import { PathInfo } from './path-info';

function getChild<T extends DataSnapshot = DataSnapshot>(snapshot: T, path: string|number, previous = false) {
    if (!snapshot.exists()) { return null; }
    let child = previous ? snapshot.previous() : snapshot.val();
    if (typeof path === 'number') {
        return child[path];
    }
    PathInfo.getPathKeys(path).every(key => {
        child = child[key];
        return typeof child !== 'undefined';
    });
    return child || null;
}

function getChildren<T extends DataSnapshot = DataSnapshot>(snapshot: T): Array<string|number> {
    if (!snapshot.exists()) { return []; }
    const value = snapshot.val();
    if (value instanceof Array) {
        return new Array(value.length).map((v,i) => i);
    }
    if (typeof value === 'object') {
        return Object.keys(value);
    }
    return [];
}

export class DataSnapshot<T = any> {
    /**
     * Referência ao nó
     */
    ref: DataReference;

    /**
     * Obtém o valor armazenado no caminho de referência ou null se não existir no banco de dados. OBS: Nos callbacks de assinatura do evento "child_removed", isso contém o valor do filho removido.
     */
    val: <Value = T>() => Value | null;

    /**
     * Se este snapshot for retornado em um callback de assinatura de evento (por exemplo, evento "child_changed" ou "mutated"), isso contém o valor anterior do caminho de referência que foi armazenado no banco de dados.
     * Ao dar a isso seu próprio parâmetro de tipo, permite ao usuário especificar um tipo diferente caso o valor anterior seja diferente.
     */
    previous: <Prev = T>() => Prev | undefined;

    /**
     * Indica se o nó existe no banco de dados.
     */
    exists(): boolean { return false; }

    /**
     * Para snapshots retornados por callbacks de eventos (por exemplo, "value", "child_changed"): obtém o contexto que foi definido na DataReference quando os dados foram atualizados.
     * Este valor é apenas leitura, use-o em vez de snap.ref.context() para garantir que você esteja usando os dados corretos para a lógica do seu negócio.
     */
    context: () => any;

    /**
     * Cria uma nova instância de DataSnapshot
     */
    constructor(ref: DataReference, value: T, isRemoved = false, prevValue?: any, context?: any) {
        this.ref = ref;
        this.val = () => { return value as any; };
        this.previous = () => { return prevValue; };
        this.exists = () => {
            if (isRemoved) { return false; }
            return value !== null && typeof value !== 'undefined';
        };
        this.context = () => { return context || {}; };
    }

    /**
     * Cria uma instância de `DataSnapshot`
     * @internal (para uso interno)
     */
    static for<Value>(ref: DataReference, value: Value): DataSnapshot {
        return new DataSnapshot(ref, value);
    }

    /**
     * Obtém uma nova snapshot para um nó filho
     * @param path chave do filho ou caminho
     * @returns Retorna uma `DataSnapshot` do filho
     */
    child<Prop extends keyof T>(key: Prop): DataSnapshot<T[Prop]>;
    child<ChildType = any>(path: string): ChildType extends keyof T ? DataSnapshot<T[ChildType]> : DataSnapshot<ChildType>;
    child(path: string | number) {
        // Cria uma nova snapshot para os dados do filho
        const val = getChild(this, path, false);
        const prev = getChild(this, path, true);
        return new DataSnapshot(this.ref.child(path), val, false, prev);
    }

    /**
     * Verifica se o valor da snapshot possui um filho com a chave ou caminho fornecido
     * @param path chave ou caminho do filho
     */
    hasChild(path: string) {
        return getChild(this, path) !== null;
    }

    /**
     * Indica se o valor da snapshot possui algum nó filho
     */
    hasChildren() {
        return getChildren(this).length > 0;
    }

    /**
     * O número de nós filhos nesta snapshot
     */
    numChildren() {
        return getChildren(this).length;
    }

    /**
     * Executa uma função de callback para cada nó filho nesta snapshot até que o callback retorne false.
     * @param callback função que é chamada com uma snapshot de cada nó filho nesta snapshot.
     * Deve retornar um valor booleano que indica se deve continuar a iteração ou não.
     */
    forEach<Child extends DataSnapshot = DataSnapshot<T[keyof T]>>(callback: (child: Child) => boolean): boolean {
        const value = this.val();
        const prev = this.previous();
        return getChildren(this).every((key: never) => {
            const snap = new DataSnapshot(this.ref.child(key), value[key], false, prev[key]);
            return callback(snap as any);
        });
    }

    /**
     * A chave do caminho do nó
     */
    get key() { return this.ref.key; }
}

export type IDataMutationsArray<Value = any, PrevValue = Value> = Array<{ target: Array<string|number>, val: Value, prev: PrevValue }>;
export class MutationsDataSnapshot<Value = any, PrevValue = Value, T extends IDataMutationsArray<Value, PrevValue> = IDataMutationsArray<Value, PrevValue>> extends DataSnapshot<T> {

    /**
     * Obtém a matriz interna de mutações. Use apenas se souber o que está fazendo.
     * Na maioria dos casos, é melhor usar `forEach` para iterar por todas as mutações.
     */
    val: <Value = T>(warn?: boolean) => Value;

    /**
     * Não use isso para obter valores anteriores de nós mutados.
     * Use as propriedades `.previous` nas snapshots individuais de cada filho em vez disso.
     * @throws Lança um erro se você o utilizar.
     */
    previous = () => { throw new Error('Iterate values to get previous values for each mutation'); };

    constructor(ref: DataReference, mutations: T, context: any) {
        super(ref, mutations, false, undefined, context);
        this.val = (warn = true) => {
            if (warn) { console.warn('Unless you know what you are doing, it is best not to use the value of a mutations snapshot directly. Use child methods and forEach to iterate the mutations instead'); }
            return mutations as any;
        };
    }

    /**
     * Executa uma função de callback para cada mutação nesta snapshot até que o callback retorne false
     * @param callback função que é chamada com uma snapshot de cada mutação nesta snapshot. Deve retornar um valor booleano que indica se deve continuar a iteração ou não.
     * @returns Retorna se todos os filhos foram iterados
     */
    forEach<Child extends DataSnapshot = DataSnapshot>(callback: (child: Child) => boolean): boolean {
        const mutations = this.val(false);
        return mutations.every(mutation => {
            const ref = mutation.target.reduce((ref, key) => ref.child(key), this.ref);
            const snap = new DataSnapshot(ref, mutation.val, false, mutation.prev);
            return callback(snap as any);
        });
    }

    /**
     * Obtém uma snapshot de um nó mutado
     * @param index índice da mutação
     * @returns Retorna uma DataSnapshot do nó mutado
     */
    child(key: string): never;
    child<ChildType = T[number]>(index: number): DataSnapshot<ChildType>;
    child(index: string | number) {
        if (typeof index !== 'number') { throw new Error('child index must be a number'); }
        const mutation = this.val(false)[index];
        const ref = mutation.target.reduce((ref, key) => ref.child(key), this.ref);
        return new DataSnapshot(ref, mutation.val as any, false, mutation.prev);
    }
}