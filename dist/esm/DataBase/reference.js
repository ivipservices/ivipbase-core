import { EventStream } from "../Lib/Subscription.js";
import { DataSnapshot, MutationsDataSnapshot } from "./snapshot.js";
import PathInfo from "../Lib/PathInfo.js";
import ID from "../Lib/ID.js";
import { getObservable } from "../Lib/OptionalObservable.js";
export class DataRetrievalOptions {
    /**
     * Opções para recuperação de dados, permite o carregamento seletivo de propriedades de objetos.
     */
    constructor(options) {
        if (!options) {
            options = {};
        }
        if (typeof options.include !== "undefined" && !(options.include instanceof Array)) {
            throw new TypeError("options.include must be an array");
        }
        if (typeof options.exclude !== "undefined" && !(options.exclude instanceof Array)) {
            throw new TypeError("options.exclude must be an array");
        }
        if (typeof options.child_objects !== "undefined" && typeof options.child_objects !== "boolean") {
            throw new TypeError("options.child_objects must be a boolean");
        }
        if (typeof options.cache_mode === "string" && !["allow", "bypass", "force"].includes(options.cache_mode)) {
            throw new TypeError("invalid value for options.cache_mode");
        }
        this.include = options.include || undefined;
        this.exclude = options.exclude || undefined;
        this.child_objects = typeof options.child_objects === "boolean" ? options.child_objects : undefined;
        this.cache_mode = typeof options.cache_mode === "string" ? options.cache_mode : typeof options.allow_cache === "boolean" ? (options.allow_cache ? "allow" : "bypass") : "allow";
        this.cache_cursor = typeof options.cache_cursor === "string" ? options.cache_cursor : undefined;
    }
}
const _private = Symbol("private");
export class DataReference {
    /**
     * Cria uma referência para um nó
     */
    constructor(db, path, vars) {
        this.db = db;
        if (!path) {
            path = "";
        }
        path = path.replace(/^\/|\/$/g, ""); // Trim slashes
        const pathInfo = PathInfo.get(path);
        const key = pathInfo.key;
        const callbacks = [];
        this[_private] = {
            get path() {
                return path;
            },
            get key() {
                return key;
            },
            get callbacks() {
                return callbacks;
            },
            vars: vars || {},
            context: {},
            pushed: false,
            cursor: null,
        };
    }
    context(context, merge = false) {
        const currentContext = this[_private].context;
        if (typeof context === "object") {
            const newContext = context ? (merge ? currentContext || {} : context) : {};
            if (context) {
                // Mesclar novo com o contexto atual
                Object.keys(context).forEach((key) => {
                    newContext[key] = context[key];
                });
            }
            this[_private].context = newContext;
            return this;
        }
        else if (typeof context === "undefined") {
            console.warn("Use snap.context() instead of snap.ref.context() to get updating context in event callbacks");
            return currentContext;
        }
        else {
            throw new Error("Invalid context argument");
        }
    }
    /**
     * Contém o último cursor recebido para este caminho referenciado (se o banco de dados conectado tiver o log de transações ativado).
     * Se você deseja ser notificado se esse valor mudar, adicione um manipulador com `ref.onCursor(callback)`.
     */
    get cursor() {
        return this[_private].cursor;
    }
    set cursor(value) {
        this[_private].cursor = value;
        this.onCursor?.(value);
    }
    get isWildcardPath() {
        return this.path.indexOf("*") >= 0 || this.path.indexOf("$") >= 0;
    }
    /**
     * O caminho com o qual esta instância foi criada
     */
    get path() {
        return this[_private].path;
    }
    /**
     * A chave ou índice deste nó
     */
    get key() {
        const key = this[_private].key;
        return typeof key === "number" ? `[${key}]` : key;
    }
    /**
     * Se a "chave" for um número, é um índice!
     */
    get index() {
        const key = this[_private].key;
        if (typeof key !== "number") {
            throw new Error(`"${key}" is not a number`);
        }
        return key;
    }
    /**
     * Retorna uma nova referência para o pai deste nó
     */
    get parent() {
        const currentPath = PathInfo.fillVariables2(this.path, this.vars);
        const info = PathInfo.get(currentPath);
        if (info.parentPath === null) {
            return null;
        }
        return new DataReference(this.db, info.parentPath).context(this[_private].context);
    }
    /**
     * Contém valores das variáveis/curingas usadas em um caminho de assinatura se esta referência foi
     * criada por um evento ("value", "child_added", etc.), ou em um caminho de mapeamento de tipo ao serializar / instanciar objetos tipados.
     */
    get vars() {
        return this[_private].vars;
    }
    /**
     * Retorna uma nova referência para um nó filho
     * @param childPath Chave de filho, índice ou caminho
     * @returns Referência para o filho
     */
    child(childPath) {
        childPath = typeof childPath === "number" ? childPath : childPath.replace(/^\/|\/$/g, "");
        const currentPath = PathInfo.fillVariables2(this.path, this.vars);
        const targetPath = PathInfo.getChildPath(currentPath, childPath);
        return new DataReference(this.db, targetPath).context(this[_private].context); //  `${this.path}/${childPath}`
    }
    /**
     * Define ou sobrescreve o valor armazenado.
     * @param value Valor a ser armazenado no banco de dados.
     * @param onComplete Callback de conclusão opcional a ser usado em vez de retornar uma promise.
     * @returns Promise que é resolvida com esta referência quando concluída.
     */
    async set(value, onComplete) {
        try {
            if (this.isWildcardPath) {
                throw new Error(`Cannot set the value of wildcard path "/${this.path}"`);
            }
            if (this.parent === null) {
                throw new Error("Cannot set the root object. Use update, or set individual child properties");
            }
            if (typeof value === "undefined") {
                throw new TypeError(`Cannot store undefined value in "/${this.path}"`);
            }
            if (!this.db.isReady) {
                await this.db.ready();
            }
            value = this.db.types.serialize(this.path, value);
            const { cursor } = await this.db.storage.set(this.path, value, { context: this[_private].context });
            this.cursor = cursor;
            if (typeof onComplete === "function") {
                try {
                    onComplete(null, this);
                }
                catch (err) {
                    console.error("Error in onComplete callback:", err);
                }
            }
        }
        catch (err) {
            if (typeof onComplete === "function") {
                try {
                    onComplete(err, this);
                }
                catch (err) {
                    console.error("Error in onComplete callback:", err);
                }
            }
            else {
                // throw again
                throw err;
            }
        }
        return this;
    }
    /**
     * Atualiza as propriedades do nó referenciado.
     * @param updates Contendo as propriedades a serem atualizadas.
     * @param onComplete Callback de conclusão opcional a ser usado em vez de retornar uma promise.
     * @return Retorna uma promise que é resolvida com esta referência quando concluída.
     */
    async update(updates, onComplete) {
        try {
            if (this.isWildcardPath) {
                throw new Error(`Cannot update the value of wildcard path "/${this.path}"`);
            }
            if (!this.db.isReady) {
                await this.db.ready();
            }
            if (typeof updates !== "object" || updates instanceof Array || updates instanceof ArrayBuffer || updates instanceof Date) {
                await this.set(updates);
            }
            else if (Object.keys(updates).length === 0) {
                console.warn(`update called on path "/${this.path}", but there is nothing to update`);
            }
            else {
                updates = this.db.types.serialize(this.path, updates);
                const { cursor } = await this.db.storage.update(this.path, updates, { context: this[_private].context });
                this.cursor = cursor;
            }
            if (typeof onComplete === "function") {
                try {
                    onComplete(null, this);
                }
                catch (err) {
                    console.error("Error in onComplete callback:", err);
                }
            }
        }
        catch (err) {
            if (typeof onComplete === "function") {
                try {
                    onComplete(err, this);
                }
                catch (err) {
                    console.error("Error in onComplete callback:", err);
                }
            }
            else {
                // throw again
                throw err;
            }
        }
        return this;
    }
    /**
     * Define o valor de um nó usando uma transação: executa sua função de retorno de chamada com o valor atual, utiliza seu valor de retorno como o novo valor a ser armazenado.
     * A transação é cancelada se sua função de retorno de chamada retornar undefined ou lançar um erro. Se sua função de retorno de chamada retornar null, o nó de destino será removido.
     * @param callback - Função de retorno de chamada que realiza a transação no valor atual do nó. Deve retornar o novo valor a ser armazenado (ou uma promise com o novo valor), undefined para cancelar a transação ou null para remover o nó.
     * @returns Retorna uma promise que é resolvida com a DataReference assim que a transação for processada.
     */
    async transaction(callback) {
        if (this.isWildcardPath) {
            throw new Error(`Cannot start a transaction on wildcard path "/${this.path}"`);
        }
        if (!this.db.isReady) {
            await this.db.ready();
        }
        let throwError;
        const cb = (currentValue) => {
            currentValue = this.db.types.deserialize(this.path, currentValue);
            const snap = new DataSnapshot(this, currentValue);
            let newValue;
            try {
                newValue = callback(snap);
            }
            catch (err) {
                // O código de retorno de chamada lançou um erro
                throwError = err; // Lembre-se do erro
                return; // cancela a transação retornando undefined
            }
            if (newValue instanceof Promise) {
                return newValue
                    .then((val) => {
                    return this.db.types.serialize(this.path, val);
                })
                    .catch((err) => {
                    throwError = err; // Lembre-se do erro
                    return; // cancela a transação retornando undefined
                });
            }
            else {
                return this.db.types.serialize(this.path, newValue);
            }
        };
        const { cursor } = await this.db.storage.transaction(this.path, cb, { context: this[_private].context });
        this.cursor = cursor;
        if (throwError) {
            // Relançar erro do código de retorno de chamada
            throw throwError;
        }
        return this;
    }
    on(event, callback, cancelCallback) {
        if (this.path === "" && ["value", "child_changed"].includes(event)) {
            // Removidos os eventos 'notify_value' e 'notify_child_changed' da lista, pois eles não exigem mais carregamento adicional de dados.
            console.warn("WARNING: Listening for value and child_changed events on the root node is a bad practice. These events require loading of all data (value event), or potentially lots of data (child_changed event) each time they are fired");
        }
        let eventPublisher;
        const eventStream = new EventStream((publisher) => {
            eventPublisher = publisher;
        });
        // Mapear NOSSO retorno de chamada para o retorno de chamada original, para que o .off possa remover o(s) retorno(s) de chamada certo(s)
        const cb = {
            event,
            stream: eventStream,
            userCallback: typeof callback === "function" ? callback : undefined,
            ourCallback: (err, path, newValue, oldValue, eventContext) => {
                if (err) {
                    // TODO: Investigar se isso realmente acontece?
                    this.db.debug.error(`Error getting data for event ${event} on path "${path}"`, err);
                    return;
                }
                const ref = this.db.ref(path);
                ref[_private].vars = PathInfo.extractVariables(this.path, path);
                let callbackObject;
                if (event.startsWith("notify_")) {
                    // No evento de dados, retorno de chamada com referência
                    callbackObject = ref.context(eventContext || {});
                }
                else {
                    const values = {
                        previous: this.db.types.deserialize(path, oldValue),
                        current: this.db.types.deserialize(path, newValue),
                    };
                    if (event === "child_removed") {
                        callbackObject = new DataSnapshot(ref, values.previous, true, values.previous, eventContext);
                    }
                    else if (event === "mutations") {
                        callbackObject = new MutationsDataSnapshot(ref, values.current, eventContext);
                    }
                    else {
                        const isRemoved = event === "mutated" && values.current === null;
                        callbackObject = new DataSnapshot(ref, values.current, isRemoved, values.previous, eventContext);
                    }
                }
                eventPublisher.publish(callbackObject);
                if (eventContext?.acebase_cursor) {
                    this.cursor = eventContext.acebase_cursor;
                }
            },
        };
        this[_private].callbacks.push(cb);
        const subscribe = () => {
            // (NOVO) Adicionar retorno de chamada ao fluxo de eventos
            // ref.on('value', callback) agora é exatamente o mesmo que ref.on('value').subscribe(callback)
            if (typeof callback === "function") {
                eventStream.subscribe(callback, (activated, cancelReason) => {
                    if (!activated) {
                        cancelCallback && cancelCallback(cancelReason);
                    }
                });
            }
            const advancedOptions = typeof callback === "object" ? callback : { newOnly: !callback }; // newOnly: se o retorno de chamada não for 'truthy', poderia alterar isso para (typeof callback !== 'function' && callback !== true), mas isso quebraria o código do cliente que usa um argumento truthy.
            if (typeof advancedOptions.newOnly !== "boolean") {
                advancedOptions.newOnly = false;
            }
            if (this.isWildcardPath) {
                advancedOptions.newOnly = true;
            }
            const cancelSubscription = (err) => {
                // Acesso negado?
                // Cancelar a assinatura
                const callbacks = this[_private].callbacks;
                callbacks.splice(callbacks.indexOf(cb), 1);
                this.db.storage.unsubscribe(this.path, event, cb.ourCallback);
                // Chamar cancelCallbacks
                this.db.debug.error(`Subscription "${event}" on path "/${this.path}" canceled because of an error: ${err.message}`);
                eventPublisher.cancel(err.message);
            };
            const authorized = this.db.storage.subscribe(this.path, event, cb.ourCallback, {
                newOnly: advancedOptions.newOnly,
                cancelCallback: cancelSubscription,
                syncFallback: advancedOptions.syncFallback,
            });
            const allSubscriptionsStoppedCallback = () => {
                const callbacks = this[_private].callbacks;
                callbacks.splice(callbacks.indexOf(cb), 1);
                return this.db.storage.unsubscribe(this.path, event, cb.ourCallback);
            };
            if (authorized instanceof Promise) {
                // A API da Web agora retorna uma promise que é resolvida se a solicitação for permitida
                // e é rejeitada quando o acesso é negado pelas regras de segurança definidas.
                authorized
                    .then(() => {
                    // Acesso concedido
                    eventPublisher.start(allSubscriptionsStoppedCallback);
                })
                    .catch(cancelSubscription);
            }
            else {
                // API local, sempre autorizada
                eventPublisher.start(allSubscriptionsStoppedCallback);
            }
            if (!advancedOptions.newOnly) {
                // Se o parâmetro de retorno de chamada for fornecido (seja uma função de retorno de chamada, true ou qualquer valor truthy),
                // ele disparará eventos para os valores atuais agora.
                // Caso contrário, espera-se que o método .subscribe seja usado, que então
                // só será chamado para eventos futuros.
                if (event === "value") {
                    this.get((snap) => {
                        eventPublisher.publish(snap);
                    });
                }
                else if (event === "child_added") {
                    this.get((snap) => {
                        const val = snap.val();
                        if (val === null || typeof val !== "object") {
                            return;
                        }
                        Object.keys(val).forEach((key) => {
                            const childSnap = new DataSnapshot(this.child(key), val[key]);
                            eventPublisher.publish(childSnap);
                        });
                    });
                }
                else if (event === "notify_child_added") {
                    // Use a API de reflexão para obter os filhos atuais.
                    // NOTA: Isso não funciona com o IvipBase <= v0.9.7, apenas quando conectado como administrador.
                    const step = 100, limit = step;
                    let skip = 0;
                    const more = async () => {
                        const { children } = await this.db.storage.reflect(this.path, "children", { limit, skip });
                        if (children && "more" in children) {
                            children.list.forEach((child) => {
                                const childRef = this.child(child.key);
                                eventPublisher.publish(childRef);
                                // typeof callback === 'function' && callback(childRef);
                            });
                            if (children.more) {
                                skip += step;
                                more();
                            }
                        }
                    };
                    more();
                }
            }
        };
        if (this.db.isReady) {
            subscribe();
        }
        else {
            this.db.ready(subscribe);
        }
        return eventStream;
    }
    off(event, callback) {
        const subscriptions = this[_private].callbacks;
        const stopSubs = subscriptions.filter((sub) => (!event || sub.event === event) && (!callback || sub.userCallback === callback));
        if (stopSubs.length === 0) {
            this.db.debug.warn(`Can't find event subscriptions to stop (path: "${this.path}", event: ${event || "(any)"}, callback: ${callback})`);
        }
        stopSubs.forEach((sub) => {
            sub.stream.stop();
        });
        return this;
    }
    get(optionsOrCallback, callback) {
        if (!this.db.isReady) {
            const promise = this.db.ready().then(() => this.get(optionsOrCallback, callback));
            return typeof optionsOrCallback !== "function" && typeof callback !== "function" ? promise : undefined; // retorna apenas uma promise se nenhum retorno de chamada for utilizado
        }
        callback = typeof optionsOrCallback === "function" ? optionsOrCallback : typeof callback === "function" ? callback : undefined;
        if (this.isWildcardPath) {
            const error = new Error(`Cannot get value of wildcard path "/${this.path}". Use .query() instead`);
            if (typeof callback === "function") {
                throw error;
            }
            return Promise.reject(error);
        }
        const options = new DataRetrievalOptions(typeof optionsOrCallback === "object" ? optionsOrCallback : { cache_mode: "allow" });
        const promise = this.db.storage.get(this.path, options).then((result) => {
            const isNewApiResult = "context" in result && "value" in result;
            if (!isNewApiResult) {
                // A versão do pacote acebase-core foi atualizada, mas os pacotes acebase ou acebase-client não foram? Aviso, mas não lance um erro.
                console.warn("IvipBase api.get method returned an old response value. Update your acebase or acebase-client package");
                result = { value: result, context: {} };
            }
            const value = this.db.types.deserialize(this.path, result.value);
            const snapshot = new DataSnapshot(this, value, undefined, undefined, result.context);
            if (result.context?.acebase_cursor) {
                this.cursor = result.context.acebase_cursor;
            }
            return snapshot;
        });
        if (callback) {
            promise.then(callback).catch((err) => {
                console.error("Uncaught error:", err);
            });
            return;
        }
        else {
            return promise;
        }
    }
    /**
     * Aguarda a ocorrência de um evento
     * @param event Nome do evento, por exemplo, "value", "child_added", "child_changed", "child_removed"
     * @param options Opções de recuperação de dados, para incluir ou excluir chaves específicas de filhos
     * @returns Retorna uma promise que é resolvida com uma snapshot dos dados
     */
    once(event, options) {
        if (event === "value" && !this.isWildcardPath) {
            // Shortcut, do not start listening for future events
            return this.get(options);
        }
        return new Promise((resolve) => {
            const callback = (snap) => {
                this.off(event, callback); // unsubscribe directly
                resolve(snap);
            };
            this.on(event, callback);
        });
    }
    /**
     * @param value Valor opcional para armazenar no banco de dados imediatamente
     * @param onComplete Função de retorno de chamada opcional para ser executada uma vez que o valor foi armazenado
     * @returns Retorna uma promise que é resolvida com a referência após o valor passado ter sido armazenado
     */
    push(value, onComplete) {
        if (this.isWildcardPath) {
            const error = new Error(`Cannot push to wildcard path "/${this.path}"`);
            if (typeof value === "undefined" || typeof onComplete === "function") {
                throw error;
            }
            return Promise.reject(error);
        }
        const id = ID.generate();
        const ref = this.child(id);
        ref[_private].pushed = true;
        if (typeof value !== "undefined") {
            return ref.set(value, onComplete).then(() => ref);
        }
        else {
            return ref;
        }
    }
    /**
     * Remove este nó e todos os filhos
     */
    async remove() {
        if (this.isWildcardPath) {
            throw new Error(`Cannot remove wildcard path "/${this.path}". Use query().remove instead`);
        }
        if (this.parent === null) {
            throw new Error("Cannot remove the root node");
        }
        return this.set(null);
    }
    /**
     * Verifica rapidamente se esta referência possui um valor no banco de dados, sem retornar seus dados
     * @returns Retorna uma promise que é resolvida com um valor booleano
     */
    async exists() {
        if (this.isWildcardPath) {
            throw new Error(`Cannot check wildcard path "/${this.path}" existence`);
        }
        if (!this.db.isReady) {
            await this.db.ready();
        }
        return this.db.storage.exists(this.path);
    }
    /**
     * Cria um objeto de consulta para o nó atual
     */
    query() {
        return new DataReferenceQuery(this);
    }
    /**
     * Obtém o número de filhos que este nó possui, utiliza reflexão
     */
    async count() {
        const info = await this.reflect("info", { child_count: true });
        return info.children.count;
    }
    async reflect(type, args) {
        if (this.isWildcardPath) {
            throw new Error(`Cannot reflect on wildcard path "/${this.path}"`);
        }
        if (!this.db.isReady) {
            await this.db.ready();
        }
        return this.db.storage.reflect(this.path, type, args);
    }
    async export(write, options = { format: "json", type_safe: true }) {
        if (this.isWildcardPath) {
            throw new Error(`Cannot export wildcard path "/${this.path}"`);
        }
        if (!this.db.isReady) {
            await this.db.ready();
        }
        const writeFn = typeof write === "function" ? write : write.write.bind(write);
        return this.db.storage.export(this.path, writeFn, options);
    }
    /**
     * Importa o valor deste nó e todos os filhos
     * @param read Função que lê dados do seu fluxo
     * @param options Atualmente, o único formato suportado é json
     * @returns Retorna uma promise que é resolvida assim que todos os dados forem importados
     */
    async import(read, options = { format: "json", suppress_events: false }) {
        if (this.isWildcardPath) {
            throw new Error(`Cannot import to wildcard path "/${this.path}"`);
        }
        if (!this.db.isReady) {
            await this.db.ready();
        }
        return this.db.storage.import(this.path, read, options);
    }
    /**
     * @param options Opções opcionais iniciais de recuperação de dados.
     * Não recomendado para uso ainda - os includes/excludes fornecidos não são aplicados às mutações recebidas,
     * ou ações de sincronização ao usar um IvipBase com banco de dados de cache.
     */
    observe(options) {
        // options não deve ser usado ainda - não podemos prevenir/filtrar eventos de mutação em caminhos excluídos no momento
        if (options) {
            throw new Error("observe does not support data retrieval options yet");
        }
        if (this.isWildcardPath) {
            throw new Error(`Cannot observe wildcard path "/${this.path}"`);
        }
        const Observable = getObservable();
        return new Observable((observer) => {
            let cache, resolved = false;
            let promise = Promise.all([this.get(options)]).then(([snap]) => {
                resolved = true;
                cache = snap.val();
                observer.next(cache);
            });
            const updateCache = (snap) => {
                if (!resolved) {
                    promise = promise.then(() => updateCache(snap));
                    return;
                }
                const mutatedPath = snap.ref.path;
                if (mutatedPath === this.path) {
                    cache = snap.val();
                    return observer.next(cache);
                }
                const trailKeys = PathInfo.getPathKeys(mutatedPath).slice(PathInfo.getPathKeys(this.path).length);
                let target = cache;
                while (trailKeys.length > 1) {
                    const key = trailKeys.shift();
                    if (typeof key === "string" || typeof key === "number") {
                        if (!(key in target)) {
                            // Ocorre se os dados carregados inicialmente não incluíram / excluíram esses dados,
                            // ou se perdemos um evento
                            target[key] = typeof trailKeys[0] === "number" ? [] : {};
                        }
                        target = target[key];
                    }
                }
                const prop = trailKeys.shift();
                const newValue = snap.val();
                if (typeof prop === "string" || typeof prop === "number") {
                    if (newValue === null) {
                        // Remova isso
                        target instanceof Array && typeof prop === "number" ? target.splice(prop, 1) : delete target[prop];
                    }
                    else {
                        // Defina ou atualize isso
                        target[prop] = newValue;
                    }
                }
                observer.next(cache);
            };
            this.on("mutated", updateCache); // TODO: Refatorar para o evento 'mutations' em vez disso
            // Retornar a função de cancelamento da inscrição
            return () => {
                this.off("mutated", updateCache);
            };
        });
    }
    async forEach(callbackOrOptions, callback) {
        let options;
        if (typeof callbackOrOptions === "function") {
            callback = callbackOrOptions;
        }
        else {
            options = callbackOrOptions;
        }
        if (typeof callback !== "function") {
            throw new TypeError("No callback function given");
        }
        // Obtenha todos os filhos por meio de reflexão. Isso pode ser ajustado ainda mais usando paginação
        const { children } = await this.reflect("children", { limit: 0, skip: 0 }); // Obtém TODAS as chaves dos filhos
        const summary = {
            canceled: false,
            total: children && "list" in children ? children?.list.length : 0,
            processed: 0,
        };
        // Iterar por todos os filhos até que a função de retorno de chamada retorne false
        if (children && "list" in children) {
            for (let i = 0; i < children.list.length; i++) {
                const key = children.list[i].key;
                // Obter dados do filho
                const snapshot = await this.child(key).get(options);
                summary.processed++;
                if (!snapshot || !snapshot.exists()) {
                    // Foi removido nesse meio tempo, pule
                    continue;
                }
                // Executar a função de retorno de chamada
                const result = await callback(snapshot);
                if (result === false) {
                    summary.canceled = true;
                    break; // Parar o loop
                }
            }
        }
        return summary;
    }
    async getMutations(cursorOrDate) {
        const cursor = typeof cursorOrDate === "string" ? cursorOrDate : undefined;
        const timestamp = cursorOrDate === null || typeof cursorOrDate === "undefined" ? 0 : cursorOrDate instanceof Date ? cursorOrDate.getTime() : Date.now();
        return this.db.storage.getMutations({ path: this.path, cursor, timestamp });
    }
    async getChanges(cursorOrDate) {
        const cursor = typeof cursorOrDate === "string" ? cursorOrDate : undefined;
        const timestamp = cursorOrDate === null || typeof cursorOrDate === "undefined" ? 0 : cursorOrDate instanceof Date ? cursorOrDate.getTime() : Date.now();
        return this.db.storage.getChanges({ path: this.path, cursor, timestamp });
    }
}
export class QueryDataRetrievalOptions extends DataRetrievalOptions {
    /**
     * @param options Opções para recuperação de dados, permite o carregamento seletivo de propriedades de objeto
     */
    constructor(options) {
        super(options);
        if (!["undefined", "boolean"].includes(typeof options.snapshots)) {
            throw new TypeError("options.snapshots must be a boolean");
        }
        this.snapshots = typeof options.snapshots === "boolean" ? options.snapshots : true;
    }
}
export class DataSnapshotsArray extends Array {
    static from(snaps) {
        const arr = new DataSnapshotsArray(snaps.length);
        snaps.forEach((snap, i) => (arr[i] = snap));
        return arr;
    }
    getValues() {
        return this.map((snap) => snap.val());
    }
}
export class DataReferencesArray extends Array {
    static from(refs) {
        const arr = new DataReferencesArray(refs.length);
        refs.forEach((ref, i) => (arr[i] = ref));
        return arr;
    }
    getPaths() {
        return this.map((ref) => ref.path);
    }
}
export class DataReferenceQuery {
    /**
     * Cria uma consulta em uma referência
     */
    constructor(ref) {
        this.ref = ref;
        this[_private] = {
            filters: [],
            skip: 0,
            take: 0,
            order: [],
            events: {},
        };
    }
    /**
     * Aplica um filtro aos filhos da referência sendo consultada.
     * Se houver um índice na chave da propriedade que está sendo consultada, ele será usado
     * para acelerar a consulta.
     * @param key Propriedade para testar o valor
     * @param op Operador a ser usado
     * @param compare Valor a ser comparado
     */
    filter(key, op, compare) {
        if ((op === "in" || op === "!in") && (!(compare instanceof Array) || compare.length === 0)) {
            throw new Error(`${op} filter for ${key} must supply an Array compare argument containing at least 1 value`);
        }
        if ((op === "between" || op === "!between") && (!(compare instanceof Array) || compare.length !== 2)) {
            throw new Error(`${op} filter for ${key} must supply an Array compare argument containing 2 values`);
        }
        if ((op === "matches" || op === "!matches") && !(compare instanceof RegExp)) {
            throw new Error(`${op} filter for ${key} must supply a RegExp compare argument`);
        }
        // DISABLED 2019/10/23 because it is not fully implemented only works locally
        // if (op === "custom" && typeof compare !== "function") {
        //     throw `${op} filter for ${key} must supply a Function compare argument`;
        // }
        // DISABLED 2022/08/15, implemented by query.ts in acebase
        // if ((op === 'contains' || op === '!contains') && ((typeof compare === 'object' && !(compare instanceof Array) && !(compare instanceof Date)) || (compare instanceof Array && compare.length === 0))) {
        //     throw new Error(`${op} filter for ${key} must supply a simple value or (non-zero length) array compare argument`);
        // }
        this[_private].filters.push({ key, op, compare });
        return this;
    }
    /**
     * @deprecated use `.filter` instead
     */
    where(key, op, compare) {
        return this.filter(key, op, compare);
    }
    /**
     * Limits the number of query results
     */
    take(n) {
        this[_private].take = n;
        return this;
    }
    /**
     * Skips the first n query results
     */
    skip(n) {
        this[_private].skip = n;
        return this;
    }
    sort(key, ascending = true) {
        if (!["string", "number"].includes(typeof key)) {
            throw "key must be a string or number";
        }
        this[_private].order.push({ key, ascending });
        return this;
    }
    /**
     * @deprecated use `.sort` instead
     */
    order(key, ascending = true) {
        return this.sort(key, ascending);
    }
    get(optionsOrCallback, callback) {
        if (!this.ref.db.isReady) {
            const promise = this.ref.db.ready().then(() => this.get(optionsOrCallback, callback));
            return typeof optionsOrCallback !== "function" && typeof callback !== "function" ? promise : undefined; // only return promise if no callback is used
        }
        callback = typeof optionsOrCallback === "function" ? optionsOrCallback : typeof callback === "function" ? callback : undefined;
        const options = new QueryDataRetrievalOptions(typeof optionsOrCallback === "object" ? optionsOrCallback : { snapshots: true, cache_mode: "allow" });
        options.allow_cache = options.cache_mode !== "bypass"; // Backward compatibility when using older acebase-client
        options.eventHandler = (ev) => {
            // TODO: implement context for query events
            if (!this[_private].events[ev.name]) {
                return false;
            }
            const listeners = this[_private].events[ev.name];
            if (typeof listeners !== "object" || listeners.length === 0) {
                return false;
            }
            if (["add", "change", "remove"].includes(ev.name)) {
                const eventData = {
                    name: ev.name,
                    ref: new DataReference(this.ref.db, ev.path),
                };
                if (eventData.ref && options.snapshots && ev.name !== "remove") {
                    const val = db.types.deserialize(ev.path, ev.value);
                    eventData.snapshot = new DataSnapshot(eventData.ref, val, false);
                }
                ev = eventData;
            }
            listeners.forEach((callback) => {
                try {
                    callback(ev);
                }
                catch (err) {
                    this.ref.db.debug.error(`Error executing "${ev.name}" event handler of realtime query on path "${this.ref.path}": ${err?.stack ?? err?.message ?? err}`);
                }
            });
        };
        // Check if there are event listeners set for realtime changes
        options.monitor = { add: false, change: false, remove: false };
        if (this[_private].events) {
            if (this[_private].events["add"] && this[_private].events["add"].length > 0) {
                options.monitor.add = true;
            }
            if (this[_private].events["change"] && this[_private].events["change"].length > 0) {
                options.monitor.change = true;
            }
            if (this[_private].events["remove"] && this[_private].events["remove"].length > 0) {
                options.monitor.remove = true;
            }
        }
        // Interrompe os resultados em tempo real se ainda estiverem habilitados em um .get anterior nesta instância
        this.stop();
        // NOTA: retorna uma promise aqui, independentemente do argumento de retorno de chamada. Bom argumento para refatorar o método para async/await em breve
        const db = this.ref.db;
        return db.storage
            .query(this.ref.path, this[_private], options)
            .catch((err) => {
            throw new Error(err);
        })
            .then((res) => {
            const { stop } = res;
            let { results, context } = res;
            this.stop = async () => {
                await stop();
            };
            if (!("results" in res && "context" in res)) {
                console.warn("Query results missing context. Update your acebase and/or acebase-client packages");
                (results = res), (context = {});
            }
            if (options.snapshots) {
                const snaps = results.map((result) => {
                    const val = db.types.deserialize(result.path, result.val);
                    return new DataSnapshot(db.ref(result.path), val, false, undefined, context);
                });
                return DataSnapshotsArray.from(snaps);
            }
            else {
                const refs = results.map((path) => db.ref(path));
                return DataReferencesArray.from(refs);
            }
        })
            .then((results) => {
            callback && callback(results);
            return results;
        });
    }
    /**
     * Stops a realtime query, no more notifications will be received.
     */
    async stop() {
        // Overridden by .get
    }
    /**
     * Executes the query and returns references. Short for `.get({ snapshots: false })`
     * @param callback callback to use instead of returning a promise
     * @returns returns an Promise that resolves with an array of DataReferences, or void when using a callback
     * @deprecated Use `find` instead
     */
    getRefs(callback) {
        return this.get({ snapshots: false }, callback);
    }
    /**
     * Executes the query and returns an array of references. Short for `.get({ snapshots: false })`
     */
    find() {
        return this.get({ snapshots: false });
    }
    /**
     * Executes the query and returns the number of results
     */
    async count() {
        const refs = await this.find();
        return refs.length;
    }
    /**
     * Executes the query and returns if there are any results
     */
    async exists() {
        const originalTake = this[_private].take;
        const p = this.take(1).find();
        this.take(originalTake);
        const refs = await p;
        return refs.length !== 0;
    }
    /**
     * Executes the query, removes all matches from the database
     * @returns returns a Promise that resolves once all matches have been removed
     */
    async remove(callback) {
        const refs = await this.find();
        // Perform updates on each distinct parent collection (only 1 parent if this is not a wildcard path)
        const parentUpdates = refs.reduce((parents, ref) => {
            if (ref.parent) {
                const parent = parents[ref.parent.path];
                if (!parent) {
                    parents[ref.parent.path] = [ref];
                }
                else {
                    parent.push(ref);
                }
            }
            return parents;
        }, {});
        const db = this.ref.db;
        const promises = Object.keys(parentUpdates).map(async (parentPath) => {
            const updates = refs.reduce((updates, ref) => {
                updates[ref.key] = null;
                return updates;
            }, {});
            const ref = db.ref(parentPath);
            try {
                await ref.update(updates);
                return { ref, success: true };
            }
            catch (error) {
                return { ref, success: false, error };
            }
        });
        const results = await Promise.all(promises);
        callback && callback(results);
        return results;
    }
    on(event, callback) {
        if (!this[_private].events[event]) {
            this[_private].events[event] = [];
        }
        this[_private].events[event].push(callback);
        return this;
    }
    /**
     * Unsubscribes from (a) previously added event(s)
     * @param event Name of the event
     * @param callback callback function to remove
     * @returns returns reference to this query
     */
    off(event, callback) {
        if (typeof event === "undefined") {
            this[_private].events = {};
            return this;
        }
        if (!this[_private].events[event]) {
            return this;
        }
        if (typeof callback === "undefined") {
            delete this[_private].events[event];
            return this;
        }
        const index = this[_private].events[event].indexOf(callback);
        if (!~index) {
            return this;
        }
        this[_private].events[event].splice(index, 1);
        return this;
    }
    async forEach(callbackOrOptions, callback) {
        let options;
        if (typeof callbackOrOptions === "function") {
            callback = callbackOrOptions;
        }
        else {
            options = callbackOrOptions;
        }
        if (typeof callback !== "function") {
            throw new TypeError("No callback function given");
        }
        // Get all query results. This could be tweaked further using paging
        const refs = await this.find();
        const summary = {
            canceled: false,
            total: refs.length,
            processed: 0,
        };
        // Iterate through all children until callback returns false
        for (let i = 0; i < refs.length; i++) {
            const ref = refs[i];
            // Get child data
            const snapshot = await ref.get(options);
            summary.processed++;
            if (!snapshot || !snapshot.exists()) {
                // Was removed in the meantime, skip
                continue;
            }
            // Run callback
            const result = await callback(snapshot);
            if (result === false) {
                summary.canceled = true;
                break; // Stop looping
            }
        }
        return summary;
    }
}
//# sourceMappingURL=reference.js.map