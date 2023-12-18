import { EventStream } from "../Lib/Subscription";
import { DataSnapshot } from "./snapshot";
import DataBase from "./";
import { EventCallback, EventSettings, ForEachIteratorCallback, ForEachIteratorResult, IStreamLike, NotifyEvent, PathVariables, QueryHintsEventCallback, QueryOperator, QueryRemoveResult, QueryStatsEventCallback, RealtimeQueryEventCallback, StreamReadFunction, StreamWriteFunction, ValueEvent } from "../Types";
import { ReflectionNodeInfo, ValueChange, ValueMutation } from "../Types/api";
import { type Observable } from "../Lib/OptionalObservable";
export declare class DataRetrievalOptions {
    /**
     * Chaves de filhos a serem incluídas (excluirá outras chaves), podendo incluir curingas (por exemplo, "mensagens/*\/título").
     */
    include?: Array<string | number>;
    /**
     * Chaves de filhos a serem excluídas (incluirá outras chaves), podendo incluir curingas (por exemplo, "mensagens/*\/respostas").
     */
    exclude?: Array<string | number>;
    /**
     * se deve ou não incluir quaisquer objetos filhos, o padrão é verdadeiro
     */
    child_objects?: boolean;
    /**
     * Se um valor em cache pode ser utilizado. Um valor em cache será usado se o cliente estiver offline, se a configuração de prioridade de cache for verdadeira, ou se o valor em cache estiver disponível e o valor do servidor demorar muito para carregar (>1s). Se o valor solicitado não estiver filtrado, o cache será atualizado com o valor recebido do servidor, acionando quaisquer ouvintes de eventos definidos no caminho. O padrão é `true`.
     * @deprecated Utilize `cache_mode: "allow"` em vez disso.
     * @default true
     */
    allow_cache?: boolean;
    /**
     * Usa um cursor para atualizar o cache local com mutações do servidor, em seguida, carrega e serve o valor inteiro do cache. Só funciona em combinação com `cache_mode: "allow"`.
     *
     * Requer um `IvipBase` com banco de dados de cache.
     */
    cache_cursor?: string;
    /**
     * Determina se é permitido carregar o valor do cache:
     * - `"allow"`: (padrão) um valor em cache será usado se o cliente estiver offline, se a configuração de `priority` de cache for `"cache"`, ou se o valor em cache estiver disponível e o valor do servidor demorar muito para carregar (>1s). Se o valor solicitado não estiver filtrado, o cache será atualizado com o valor recebido do servidor, acionando quaisquer ouvintes de eventos definidos no caminho.
     * - `"bypass"`: O valor será carregado do servidor. Se o valor solicitado não estiver filtrado, o cache será atualizado com o valor recebido do servidor, acionando quaisquer ouvintes de eventos definidos no caminho.
     * - `"force"`: Força o valor a ser carregado apenas do cache.
     *
     * O contexto de uma snapshot retornada refletirá de onde os dados foram carregados: `snap.context().ivipbase_origin` será definido como `"cache"`, `"server"`, ou `"hybrid"` se um `cache_cursor` foi usado.
     *
     * Requer um `IvipBase` com banco de dados de cache.
     * @default "allow"
     */
    cache_mode?: "allow" | "bypass" | "force";
    /**
     * Opções para recuperação de dados, permite o carregamento seletivo de propriedades de objetos.
     */
    constructor(options: DataRetrievalOptions);
}
declare const _private: unique symbol;
export declare class DataReference<T = any> {
    readonly db: DataBase;
    private [_private];
    /**
     * Cria uma referência para um nó
     */
    constructor(db: DataBase, path: string, vars?: PathVariables);
    /**
     * Adiciona informações contextuais para atualizações no banco de dados por meio desta referência.
     * Isso permite identificar a fonte do evento (e/ou motivo) das alterações de dados que estão sendo acionadas.
     * Pode ser usado, por exemplo, para rastrear se as atualizações de dados foram realizadas pelo cliente local, um
     * cliente remoto ou pelo servidor. E também por que foi alterado e por quem.
     * @param context Contexto a ser definido para esta referência.
     * @param merge Se deve mesclar o objeto de contexto fornecido com o contexto previamente definido. O padrão é false.
     * @returns Retorna esta instância ou o contexto previamente definido ao chamar context().
     * @example
     * // Em algum lugar do seu código no backend:
     * db.ref('contas/123/saldo')
     *  .context({ acao: 'saque', descricao: 'Saque de €50 no caixa eletrônico' })
     *  .transaction(snap => {
     *      let saldo = snap.val();
     *      return saldo - 50;
     *  });
     *
     * // E, em algum lugar do seu código no frontend:
     * db.ref('contas/123/saldo')
     *  .on('value', snap => {
     *      // O saldo da conta mudou, verifique o contexto utilizado
     *      const novoSaldo = snap.val();
     *      const contextoAtualizacao = snap.context(); // não snap.ref.context()
     *      switch (contextoAtualizacao.acao) {
     *          case 'pagamento': alert('Seu pagamento foi processado!'); break;
     *          case 'deposito': alert('Dinheiro foi adicionado à sua conta'); break;
     *          case 'saque': alert('Você acabou de sacar dinheiro da sua conta'); break;
     *      }
     * });
     */
    context(context: any, merge?: boolean): DataReference;
    /**
     * Obtém um contexto previamente definido nesta referência. Se a referência for retornada
     * por meio de um retorno de chamada de evento de dados, ela contém o contexto usado na referência
     * usada para atualizar os dados.
     * @returns Retorna o contexto previamente definido.
     */
    context(): any;
    /**
     * Contém o último cursor recebido para este caminho referenciado (se o banco de dados conectado tiver o log de transações ativado).
     * Se você deseja ser notificado se esse valor mudar, adicione um manipulador com `ref.onCursor(callback)`.
     */
    get cursor(): string;
    private set cursor(value);
    /**
     * Anexa uma função de retorno de chamada para ser notificado de alterações no cursor para esta referência. O cursor é atualizado nestas ocasiões:
     * - Após qualquer um dos seguintes eventos terem ocorrido: `value`, `child_changed`, `child_added`, `child_removed`, `mutations`, `mutated`.
     * - Após qualquer um destes métodos ter terminado de salvar um valor no banco de dados: `set`, `update`, `transaction`. Se estiver conectado a
     * um servidor remoto, o cursor é atualizado assim que o valor do servidor for atualizado.
     */
    onCursor?: (cursor: string | null | undefined) => any;
    get isWildcardPath(): boolean;
    /**
     * O caminho com o qual esta instância foi criada
     */
    get path(): string;
    /**
     * A chave ou índice deste nó
     */
    get key(): string;
    /**
     * Se a "chave" for um número, é um índice!
     */
    get index(): number;
    /**
     * Retorna uma nova referência para o pai deste nó
     */
    get parent(): DataReference | null;
    /**
     * Contém valores das variáveis/curingas usadas em um caminho de assinatura se esta referência foi
     * criada por um evento ("value", "child_added", etc.), ou em um caminho de mapeamento de tipo ao serializar / instanciar objetos tipados.
     */
    get vars(): PathVariables;
    /**
     * Retorna uma nova referência para um nó filho
     * @param childPath Chave de filho, índice ou caminho
     * @returns Referência para o filho
     */
    child<Child = any>(childPath: string | number): DataReference<Child>;
    /**
     * Define ou sobrescreve o valor armazenado.
     * @param value Valor a ser armazenado no banco de dados.
     * @param onComplete Callback de conclusão opcional a ser usado em vez de retornar uma promise.
     * @returns Promise que é resolvida com esta referência quando concluída.
     */
    set(value: T, onComplete?: (err: Error, ref: DataReference) => void): Promise<this>;
    /**
     * Atualiza as propriedades do nó referenciado.
     * @param updates Contendo as propriedades a serem atualizadas.
     * @param onComplete Callback de conclusão opcional a ser usado em vez de retornar uma promise.
     * @return Retorna uma promise que é resolvida com esta referência quando concluída.
     */
    update(updates: Partial<T>, onComplete?: (err: Error, ref: DataReference) => void): Promise<this>;
    /**
     * Define o valor de um nó usando uma transação: executa sua função de retorno de chamada com o valor atual, utiliza seu valor de retorno como o novo valor a ser armazenado.
     * A transação é cancelada se sua função de retorno de chamada retornar undefined ou lançar um erro. Se sua função de retorno de chamada retornar null, o nó de destino será removido.
     * @param callback - Função de retorno de chamada que realiza a transação no valor atual do nó. Deve retornar o novo valor a ser armazenado (ou uma promise com o novo valor), undefined para cancelar a transação ou null para remover o nó.
     * @returns Retorna uma promise que é resolvida com a DataReference assim que a transação for processada.
     */
    transaction<Value = T>(callback: (currentValue: DataSnapshot<Value>) => any): Promise<this>;
    /**
     * Inscreve-se em um evento. Os eventos suportados são "value", "child_added", "child_changed", "child_removed",
     * que executarão a função de retorno de chamada com uma snapshot dos dados. Se desejar apenas receber notificações do
     * evento (sem os dados), use os eventos "notify_value", "notify_child_added", "notify_child_changed",
     * "notify_child_removed" em vez disso, que executarão a função de retorno de chamada com uma DataReference para os dados alterados.
     * Isso permite que você recupere manualmente dados quando houver alterações (por exemplo, se quiser excluir certos dados filhos do carregamento).
     * @param event Nome do evento para se inscrever
     * @param callback Função de retorno de chamada, configurações de evento ou se deve ou não executar callbacks nos valores atuais ao usar eventos "value" ou "child_added"
     * @param cancelCallback Função a ser chamada quando a inscrição não for permitida ou o acesso for negado posteriormente
     * @param fireForCurrentValue Se deve ou não executar callbacks nos valores atuais ao usar eventos "value" ou "child_added"
     * @param options Opções avançadas
     * @returns Retorna um EventStream
     */
    on<Val = T>(event: ValueEvent): EventStream<DataSnapshot<Val>>;
    on<Val = T>(event: ValueEvent, callback: EventCallback<DataSnapshot<Val>>): EventStream<DataSnapshot<Val>>;
    on<Val = T>(event: ValueEvent, callback: EventCallback<DataSnapshot<Val>>, cancelCallback: (error: string) => void): EventStream<DataSnapshot<Val>>;
    on<Val = T>(event: ValueEvent, options: EventSettings): EventStream<DataSnapshot<Val>>;
    on<Val = T>(event: NotifyEvent): EventStream<DataReference<Val>>;
    on<Val = T>(event: NotifyEvent, callback: EventCallback<DataReference<Val>>): EventStream<DataReference<Val>>;
    on<Val = T>(event: NotifyEvent, callback: EventCallback<DataReference<Val>>, cancelCallback: (error: string) => void): EventStream<DataReference<Val>>;
    on<Val = T>(event: NotifyEvent, options: EventSettings): EventStream<DataReference<Val>>;
    /** @deprecated Utilize a assinatura `on(event, { newOnly: boolean })` em vez disso */
    on<Val = T>(event: ValueEvent, fireForCurrentValue: boolean, cancelCallback?: (error: string) => void): EventStream<DataSnapshot<Val>>;
    /** @deprecated Utilize a assinatura `on(event, { newOnly: boolean })` em vez disso */
    on<Val = T>(event: NotifyEvent, fireForCurrentValue: boolean, cancelCallback?: (error: string) => void): EventStream<DataReference<Val>>;
    /**
     * Cancela a inscrição de um evento previamente adicionado
     * @param event Nome do evento
     * @param callback Função de retorno de chamada a ser removida
     * @returns Retorna esta instância de `DataReference`
     */
    off(event?: ValueEvent, callback?: EventCallback<DataSnapshot>): this;
    off(event?: NotifyEvent, callback?: EventCallback<DataReference>): this;
    /**
     * Obtém uma snapshot do valor armazenado
     * @returns Retorna uma promise que é resolvida com uma snapshot dos dados
     */
    get<Value = T>(): Promise<DataSnapshot<Value>>;
    /**
     * Obtém uma snapshot do valor armazenado, com/sem dados específicos de filhos
     * @param options Opções de recuperação de dados para incluir ou excluir chaves específicas de filhos.
     * @returns Retorna uma promise que é resolvida com uma snapshot dos dados
     */
    get<Value = T>(options: DataRetrievalOptions): Promise<DataSnapshot<Value>>;
    /**
     * Obtém uma snapshot do valor armazenado. Método abreviado para .once("value", callback)
     * @param callback Função de retorno de chamada para ser executada com uma snapshot dos dados em vez de retornar uma promise
     * @returns Não retorna nada porque um retorno de chamada é utilizado
     */
    get<Value = T>(callback: EventCallback<DataSnapshot<Value>>): void;
    /**
     * Obtém uma snapshot do valor armazenado, com/sem dados específicos de filhos
     * @param {DataRetrievalOptions} options Opções de recuperação de dados para incluir ou excluir chaves específicas de filhos.
     * @param callback Função de retorno de chamada para ser executada com uma snapshot dos dados em vez de retornar uma promise
     * @returns Não retorna nada porque um retorno de chamada é utilizado
     */
    get<Value = T>(options: DataRetrievalOptions, callback: EventCallback<DataSnapshot<Value>>): void;
    get<Value = T>(optionsOrCallback?: DataRetrievalOptions | EventCallback<DataSnapshot<Value>>, callback?: EventCallback<DataSnapshot<Value>>): Promise<DataSnapshot<Value>> | void;
    /**
     * Aguarda a ocorrência de um evento
     * @param event Nome do evento, por exemplo, "value", "child_added", "child_changed", "child_removed"
     * @param options Opções de recuperação de dados, para incluir ou excluir chaves específicas de filhos
     * @returns Retorna uma promise que é resolvida com uma snapshot dos dados
     */
    once(event: ValueEvent | NotifyEvent, options?: DataRetrievalOptions): Promise<DataSnapshot<T> | void>;
    /**
     * Cria um novo filho com uma chave única e retorna a nova referência.
     * Se um valor for passado como argumento, ele será armazenado no banco de dados diretamente.
     * A referência retornada pode ser usada como uma promise que é resolvida uma vez que
     * o valor fornecido é armazenado no banco de dados.
     * @param value Valor opcional para armazenar no banco de dados imediatamente
     * @param onComplete Função de retorno de chamada opcional para ser executada uma vez que o valor foi armazenado
     * @returns Retorna uma promise que é resolvida com a referência após o valor passado ter sido armazenado
     * @example
     * // Cria um novo usuário em "game_users"
     * const ref = await db.ref("game_users")
     *   .push({ name: "Betty Boop", points: 0 });
     * // ref é uma nova referência para o objeto recém-criado,
     * // por exemplo, para: "game_users/7dpJMeLbhY0tluMyuUBK27"
     * @example
     * // Cria uma nova referência de filho com uma chave gerada,
     * // mas não a armazena ainda
     * let userRef = db.ref("users").push();
     * // ... para armazená-lo posteriormente:
     * await userRef.set({ name: "Popeye, o Marinheiro" });
     */
    push<Value = any>(value: Value, onComplete?: (err: Error, ref: DataReference) => void): Promise<DataReference<Value>>;
    /**
     * @returns Retorna uma referência para o novo filho
     */
    push(): DataReference;
    /**
     * Remove este nó e todos os filhos
     */
    remove(): Promise<this>;
    /**
     * Verifica rapidamente se esta referência possui um valor no banco de dados, sem retornar seus dados
     * @returns Retorna uma promise que é resolvida com um valor booleano
     */
    exists(): Promise<boolean>;
    /**
     * Cria um objeto de consulta para o nó atual
     */
    query(): DataReferenceQuery;
    /**
     * Obtém o número de filhos que este nó possui, utiliza reflexão
     */
    count(): Promise<number>;
    /**
     * Obtém informações sobre um nó e/ou seus filhos sem recuperar valores de objetos filhos
     * @param type Tipo de reflexão
     * @returns Retorna uma promise que é resolvida com as informações de reflexão do nó
     */
    reflect(type: "info", args: {
        /**
         * Se deve obter uma contagem do número de filhos, em vez de enumerar os filhos
         * @default false
         */
        child_count?: boolean;
        /**
         * Número máximo de filhos para enumerar
         * @default 50
         */
        child_limit?: number;
        /**
         * Número de filhos a serem ignorados durante a enumeração
         * @default 0
         */
        child_skip?: number;
        /**
         * Ignora os filhos antes E a chave fornecida durante a enumeração
         */
        child_from?: string;
    }): Promise<ReflectionNodeInfo>;
    /**
     * @returns Retorna uma promise que é resolvida com as informações de reflexão dos filhos do nó
     */
    reflect(type: "children", args: {
        /**
         * Número máximo de filhos para enumerar
         * @default 50
         */
        limit?: number;
        /**
         * Número de filhos a serem ignorados durante a enumeração
         * @default 0
         */
        skip?: number;
        /**
         * Ignora os filhos antes E a chave fornecida durante a enumeração
         */
        from?: string;
    }): Promise<ReflectionNodeInfo>;
    /**
     * Exporta o valor deste nó e todos os filhos
     * @param write Função que escreve dados no seu fluxo
     * @param options Apenas o formato suportado no momento é json
     * @returns Retorna uma promise que é resolvida assim que todos os dados forem exportados
     */
    export(write: StreamWriteFunction, options?: {
        format?: "json";
        type_safe?: boolean;
    }): Promise<void>;
    /**
     * @deprecated Use a assinatura do método com um argumento de função de gravação de fluxo em vez disso
     */
    export(stream: IStreamLike, options?: {
        format?: "json";
        type_safe?: boolean;
    }): Promise<void>;
    /**
     * Importa o valor deste nó e todos os filhos
     * @param read Função que lê dados do seu fluxo
     * @param options Atualmente, o único formato suportado é json
     * @returns Retorna uma promise que é resolvida assim que todos os dados forem importados
     */
    import(read: StreamReadFunction, options?: {
        format: string;
        suppress_events: boolean;
    }): Promise<void>;
    /**
     * Retorna um Observable RxJS que pode ser usado para observar
     * atualizações neste nó e seus filhos. Ele não retorna snapshots, então
     * você pode vincular o observable diretamente a uma visualização. O valor sendo observado
     * é atualizado internamente usando o novo evento "mutated". Todas as mutações são
     * aplicadas ao valor original e mantidas em memória.
     * @example
     * <!-- Em seu modelo de visualização Angular: -->
     * <ng-container *ngIf="liveChat | async as chat">
     *    <Message *ngFor="let item of chat.messages | keyvalue" [message]="item.value"></Message>
     * </ng-container>
     *
     * // Em seu código:
     * ngOnInit() {
     *    this.liveChat = db.ref('chats/chat_id').observe();
     * }
     *
     * // Ou, se você quiser monitorar as atualizações você mesmo:
     * ngOnInit() {
     *    this.observer = db.ref('chats/chat_id').observe().subscribe(chat => {
     *       this.chat = chat;
     *    });
     * }
     * ngOnDestroy() {
     *    // NÃO se esqueça de cancelar a inscrição!
     *    this.observer.unsubscribe();
     * }
     */
    observe<T = any>(): Observable<T>;
    /**
     * Itera por cada filho na coleção referenciada, transmitindo-os um de cada vez.
     * @param callback Função para chamar com uma `DataSnapshot` de cada filho. Se sua função
     * retorna uma `Promise`, a iteração aguardará até que ela seja resolvida antes de carregar o próximo filho.
     * A iteração é interrompida se a função de retorno de chamada retornar (ou resolver com) `false`
     * @returns Retorna uma Promise que é resolvida com um resumo da iteração.
     * @example
     * ```js
     * const result = await db.ref('books').forEach(bookSnapshot => {
     *   const book = bookSnapshot.val();
     *   console.log(`Got book "${book.title}": "${book.description}"`);
     * });
     *
     * // No exemplo acima, estamos usando apenas 'title' e 'description'
     * // de cada livro. Vamos carregar apenas esses para aumentar o desempenho:
     * const result = await db.ref('books').forEach(
     *    { include: ['title', 'description'] },
     *    bookSnapshot => {
     *       const book = bookSnapshot.val();
     *       console.log(`Got book "${book.title}": "${book.description}"`);
     *    }
     * );
     * ```
     */
    forEach<Child = any>(callback: ForEachIteratorCallback<Child>): Promise<ForEachIteratorResult>;
    /**
     * @param options Especifique quais dados carregar para cada filho. Por exemplo, `{ include: ['title', 'description'] }`
     * carregará apenas as propriedades title e description de cada filho
     */
    forEach<Child = any>(options: DataRetrievalOptions, callback: ForEachIteratorCallback<Child>): Promise<ForEachIteratorResult>;
    /**
     * Obtém mutações no caminho referenciado e seus filhos usando um cursor previamente adquirido.
     * @param cursor Cursor a ser usado. Quando não fornecido, todas as mutações disponíveis no log de transações serão retornadas.
     */
    getMutations(cursor?: string | null): Promise<{
        used_cursor: string | null;
        new_cursor: string;
        mutations: ValueMutation[];
    }>;
    /**
     * Obtém mutações no caminho referenciado e seus filhos desde uma data específica.
     * @param since Data/hora a ser usada. Quando não fornecido, todas as mutações disponíveis no log de transações serão retornadas.
     */
    getMutations(since?: Date): Promise<{
        used_cursor: string | null;
        new_cursor: string;
        mutations: ValueMutation[];
    }>;
    /**
     * Obtém alterações no caminho referenciado e seus filhos usando um cursor previamente adquirido.
     * @param cursor Cursor a ser usado. Quando não fornecido, todas as alterações disponíveis no log de transações serão retornadas.
     */
    getChanges(cursor?: string | null): Promise<{
        used_cursor: string;
        new_cursor: string;
        changes: ValueChange[];
    }>;
    /**
     * Obtém alterações no caminho referenciado e seus filhos desde uma data específica.
     * @param since Data/hora a ser usada. Quando não fornecido, todas as alterações disponíveis no log de transações serão retornadas.
     */
    getChanges(since?: Date): Promise<{
        used_cursor: string | null;
        new_cursor: string;
        changes: ValueChange[];
    }>;
}
export declare class QueryDataRetrievalOptions extends DataRetrievalOptions {
    /**
     * Se deve retornar snapshots dos nós correspondentes (incluindo dados) ou apenas referências (sem dados). O padrão é `true`.
     * @default true
     */
    snapshots?: boolean;
    /**
     * @param options Opções para recuperação de dados, permite o carregamento seletivo de propriedades de objeto
     */
    constructor(options: QueryDataRetrievalOptions);
}
export declare class DataSnapshotsArray<T = any> extends Array<DataSnapshot<T>> {
    static from<T = any>(snaps: DataSnapshot<T>[]): DataSnapshotsArray<T>;
    getValues(): (T | null)[];
}
export declare class DataReferencesArray<T = any> extends Array<DataReference<T>> {
    static from<T = any>(refs: DataReference<T>[]): DataReferencesArray<T>;
    getPaths(): string[];
}
export declare class DataReferenceQuery {
    private [_private];
    ref: DataReference;
    /**
     * Cria uma consulta em uma referência
     */
    constructor(ref: DataReference);
    /**
     * Aplica um filtro aos filhos da referência sendo consultada.
     * Se houver um índice na chave da propriedade que está sendo consultada, ele será usado
     * para acelerar a consulta.
     * @param key Propriedade para testar o valor
     * @param op Operador a ser usado
     * @param compare Valor a ser comparado
     */
    filter(key: string | number, op: QueryOperator, compare?: any): DataReferenceQuery;
    /**
     * @deprecated use `.filter` instead
     */
    where(key: string | number, op: QueryOperator, compare?: any): DataReferenceQuery;
    /**
     * Limits the number of query results
     */
    take(n: number): DataReferenceQuery;
    /**
     * Skips the first n query results
     */
    skip(n: number): DataReferenceQuery;
    /**
     * Sorts the query results
     * @param key key to sort on
     */
    sort(key: string): DataReferenceQuery;
    /**
     * @param ascending whether to sort ascending (default) or descending
     */
    sort(key: string, ascending: boolean): DataReferenceQuery;
    /**
     * @deprecated use `.sort` instead
     */
    order(key: string, ascending?: boolean): DataReferenceQuery;
    /**
     * Executa a consulta
     * @returns Retorna uma Promise que é resolvida com uma matriz de DataSnapshots
     */
    get<T = any>(): Promise<DataSnapshotsArray<T>>;
    /**
     * Executa a consulta com opções adicionais
     * @param options Opções de recuperação de dados para incluir ou excluir dados específicos do filho, e se deve retornar snapshots (padrão) ou apenas referências
     * @returns Retorna uma Promise que é resolvida com uma matriz de DataReferences
     */
    get<T = any>(options: QueryDataRetrievalOptions & {
        snapshots: false;
    }): Promise<DataReferencesArray<T>>;
    /**
     * @returns Retorna uma Promise que é resolvida com uma matriz de DataSnapshots
     */
    get<T = any>(options: QueryDataRetrievalOptions & {
        snapshots?: true;
    }): Promise<DataSnapshotsArray<T>>;
    /**
     * @returns Retorna uma Promise que é resolvida com uma matriz de DataReferences ou DataSnapshots
     */
    get<T = any>(options: QueryDataRetrievalOptions): Promise<DataReferencesArray<T> | DataSnapshotsArray<T>>;
    /**
     * @param callback Função de retorno de chamada para usar em vez de retornar uma promise
     * @returns Retorna nada porque um callback está sendo usado
     */
    get<T = any>(options: QueryDataRetrievalOptions, callback: (snapshots: DataSnapshotsArray<T>) => void): void;
    /**
     * @returns Retorna nada porque um callback está sendo usado
     */
    get<T = any>(options: QueryDataRetrievalOptions, callback: (snapshotsOrReferences: DataSnapshotsArray<T> | DataReferencesArray<T>) => void): void;
    get<T = any>(optionsOrCallback?: QueryDataRetrievalOptions | ((results: DataSnapshotsArray<T> | DataReferencesArray<T>) => void), callback?: (results: DataSnapshotsArray<T> | DataReferencesArray<T>) => void): Promise<DataSnapshotsArray<T> | DataReferencesArray<T>> | void;
    /**
     * Stops a realtime query, no more notifications will be received.
     */
    stop(): Promise<void>;
    /**
     * Executes the query and returns references. Short for `.get({ snapshots: false })`
     * @param callback callback to use instead of returning a promise
     * @returns returns an Promise that resolves with an array of DataReferences, or void when using a callback
     * @deprecated Use `find` instead
     */
    getRefs<T = any>(callback?: (references: DataReferencesArray) => void): Promise<DataReferencesArray<T>> | void;
    /**
     * Executes the query and returns an array of references. Short for `.get({ snapshots: false })`
     */
    find<T = any>(): Promise<DataReferencesArray<T>>;
    /**
     * Executes the query and returns the number of results
     */
    count(): Promise<number>;
    /**
     * Executes the query and returns if there are any results
     */
    exists(): Promise<boolean>;
    /**
     * Executes the query, removes all matches from the database
     * @returns returns a Promise that resolves once all matches have been removed
     */
    remove(callback?: (results: QueryRemoveResult[]) => void): Promise<QueryRemoveResult[]>;
    /**
     * Subscribes to an event. Supported events are:
     *  "stats": receive information about query performance.
     *  "hints": receive query or index optimization hints
     *  "add", "change", "remove": receive real-time query result changes
     * @param event Name of the event to subscribe to
     * @param callback Callback function
     * @returns returns reference to this query
     */
    on(event: "add" | "change" | "remove", callback: RealtimeQueryEventCallback): DataReferenceQuery;
    on(event: "hints", callback: QueryHintsEventCallback): DataReferenceQuery;
    on(event: "stats", callback: QueryStatsEventCallback): DataReferenceQuery;
    /**
     * Unsubscribes from (a) previously added event(s)
     * @param event Name of the event
     * @param callback callback function to remove
     * @returns returns reference to this query
     */
    off(event?: "stats" | "hints" | "add" | "change" | "remove", callback?: RealtimeQueryEventCallback): DataReferenceQuery;
    /**
     * Executes the query and iterates through each result by streaming them one at a time.
     * @param callback function to call with a `DataSnapshot` of each child. If your function
     * returns a `Promise`, iteration will wait until it resolves before loading the next child.
     * Iterating stops if callback returns (or resolves with) `false`
     * @returns Returns a Promise that resolves with an iteration summary.
     * @example
     * ```js
     * const result = await db.query('books')
     *  .filter('category', '==', 'cooking')
     *  .forEach(bookSnapshot => {
     *     const book = bookSnapshot.val();
     *     console.log(`Found cooking book "${book.title}": "${book.description}"`);
     *  });
     *
     * // In above example we're only using 'title' and 'description'
     * // of each book. Let's only load those to increase performance:
     * const result = await db.query('books')
     *  .filter('category', '==', 'cooking')
     *  .forEach(
     *    { include: ['title', 'description'] },
     *    bookSnapshot => {
     *       const book = bookSnapshot.val();
     *       console.log(`Found cooking book "${book.title}": "${book.description}"`);
     *    }
     * );
     * ```
     */
    forEach<T = any>(callback: ForEachIteratorCallback<T>): Promise<ForEachIteratorResult>;
    /**
     * @param options specify what data to load for each child. Eg `{ include: ['title', 'description'] }`
     * will only load each child's title and description properties
     */
    forEach<T = any>(options: DataRetrievalOptions, callback: ForEachIteratorCallback<T>): Promise<ForEachIteratorResult>;
}
export {};
//# sourceMappingURL=reference.d.ts.map