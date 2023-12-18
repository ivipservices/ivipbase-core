import type { DataReference } from "./reference";
export declare class DataSnapshot<T = any> {
    /**
     * Referência ao nó
     */
    ref: DataReference;
    /**
     * Obtém o valor armazenado no caminho referenciado ou nulo se não existir no banco de dados. NOTA: Em retornos de chamada de assinatura de evento "child_removed", ele contém o valor filho removido.
     */
    val: <Value = T>() => Value | null;
    /**
     * Se esse instantâneo for retornado em um retorno de chamada de assinatura de evento (por exemplo, evento "child_changed" ou "mutated"), ele conterá o valor anterior do caminho referenciado que foi armazenado no banco de dados.
     * Dar a este seu próprio parâmetro de tipo permite que o usuário especifique um tipo diferente caso o valor anterior seja diferente.
     */
    previous: <Prev = T>() => Prev | undefined;
    /**
     * Indica se o nó existe no banco de dados
     */
    exists(): boolean;
    /**
     * Para snapshots retornados por callbacks de evento (por exemplo, "value", "child_changed"): obtém o contexto que foi definido no DataReference quando os dados foram atualizados.
     * Este valor é somente leitura, use-o em vez de snap.ref.context() para ter certeza de que está usando os dados corretos para sua lógica de negócios.
     */
    context: () => any;
    /**
     * Cria uma nova instância do DataSnapshot
     */
    constructor(ref: DataReference, value: T, isRemoved?: boolean, prevValue?: any, context?: any);
    /**
     * Cria uma instância `DataSnapshot`
     * @internal (para uso interno)
     */
    static for<Value>(ref: DataReference, value: Value): DataSnapshot;
    /**
     * Obtém um novo instantâneo para um nó filho
     * @param path chave filho ou caminho
     * @returns Retorna um `DataSnapshot` do filho
     */
    child<Prop extends keyof T>(key: Prop): DataSnapshot<T[Prop]>;
    child<ChildType = any>(path: string): ChildType extends keyof T ? DataSnapshot<T[ChildType]> : DataSnapshot<ChildType>;
    /**
     * Verifica se o valor do instantâneo tem um filho com a chave ou caminho fornecido
     * @param path chave filho ou caminho
     */
    hasChild(path: string): boolean;
    /**
     * Indica se o valor do instantâneo tem algum nó filho
     */
    hasChildren(): boolean;
    /**
     * O número de nós filhos neste instantâneo
     */
    numChildren(): number;
    /**
     * Executa uma função de retorno de chamada para cada nó filho neste instantâneo até que o retorno de chamada retorne falso
     * @param callback Função de retorno de chamada com um instantâneo de cada nó filho neste instantâneo.
     * Deve retornar um valor booleano que indica se a iteração deve continuar ou não.
     */
    forEach<Child extends DataSnapshot = DataSnapshot<T[keyof T]>>(callback: (child: Child) => boolean): boolean;
    /**
     * A chave do caminho do nó
     */
    get key(): string;
}
export type IDataMutationsArray<Value = any, PrevValue = Value> = Array<{
    target: Array<string | number>;
    val: Value;
    prev: PrevValue;
}>;
export declare class MutationsDataSnapshot<Value = any, PrevValue = Value, T extends IDataMutationsArray<Value, PrevValue> = IDataMutationsArray<Value, PrevValue>> extends DataSnapshot<T> {
    /**
     * Obtém a matriz interna de mutações. Use apenas se souber o que está fazendo.
     * Na maioria dos casos, é melhor usar `forEach` para iterar por todas as mutações.
     */
    val: <Value = T>(warn?: boolean) => Value;
    /**
     * Não use isso para obter valores anteriores de nós mutados.
     * Use as propriedades `.previous` nas snapshots individuais de cada filho.
     * @throws Lança um erro se você o utilizar.
     */
    previous: () => never;
    constructor(ref: DataReference, mutations: T, context: any);
    /**
     * Executa uma função de retorno de chamada para cada mutação nesta snapshot até que a função de retorno de chamada retorne false.
     * @param callback Função chamada com uma snapshot de cada mutação nesta snapshot. Deve retornar um valor booleano que indica se deve continuar a iteração ou não.
     * @returns Retorna se cada filho foi iterado.
     */
    forEach<Child extends DataSnapshot = DataSnapshot>(callback: (child: Child) => boolean): boolean;
    /**
     * Obtém uma snapshot de um nó mutado.
     * @param index Índice da mutação.
     * @returns Retorna uma DataSnapshot do nó mutado.
     */
    child(key: string): never;
    child<ChildType = T[number]>(index: number): DataSnapshot<ChildType>;
}
//# sourceMappingURL=snapshot.d.ts.map