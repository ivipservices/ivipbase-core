import { EventPublisher, EventStream } from "../Lib/Subscription";
import { DataSnapshot, MutationsDataSnapshot } from "./snapshot";
import DataBase from "./";
import PathInfo from "../Lib/PathInfo";
import {
	EventCallback,
	EventSettings,
	ForEachIteratorCallback,
	ForEachIteratorResult,
	IEventSubscription,
	IStreamLike,
	NotifyEvent,
	PathVariables,
	QueryHintsEventCallback,
	QueryOperator,
	QueryRemoveResult,
	QueryStatsEventCallback,
	RealtimeQueryEvent,
	RealtimeQueryEventCallback,
	StreamReadFunction,
	StreamWriteFunction,
	SubscribeFunction,
	ValueEvent,
} from "../Types";
import ID from "../Lib/ID";
import { QueryFilter, QueryOptions, QueryOrder, ReflectionNodeInfo, ReflectionType, ValueChange, ValueMutation } from "../Types/api";
import { getObservable, type Observable } from "../Lib/OptionalObservable";

export class DataRetrievalOptions {
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
	constructor(options: DataRetrievalOptions) {
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

export class DataReference<T = any> {
	private [_private]: {
		readonly path: string;
		readonly key: string | number;
		readonly callbacks: IEventSubscription[];
		vars: PathVariables;
		context: any;
		pushed: boolean; // Se a DataReference foi criada por meio de .push
		cursor: string | null | undefined;
	};

	/**
	 * Cria uma referência para um nó
	 */
	constructor(public readonly db: DataBase, path: string, vars?: PathVariables) {
		if (!path) {
			path = "";
		}
		path = path.replace(/^\/|\/$/g, ""); // Trim slashes
		const pathInfo = PathInfo.get(path);
		const key = pathInfo.key;
		const callbacks = [] as IEventSubscription[];
		this[_private] = {
			get path() {
				return path;
			},
			get key() {
				return key as any;
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
	context(context?: any, merge = false): DataReference | any {
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
		} else if (typeof context === "undefined") {
			console.warn("Use snap.context() instead of snap.ref.context() to get updating context in event callbacks");
			return currentContext;
		} else {
			throw new Error("Invalid context argument");
		}
	}

	/**
	 * Contém o último cursor recebido para este caminho referenciado (se o banco de dados conectado tiver o log de transações ativado).
	 * Se você deseja ser notificado se esse valor mudar, adicione um manipulador com `ref.onCursor(callback)`.
	 */
	get cursor(): string {
		return this[_private].cursor as any;
	}
	private set cursor(value: string | null | undefined) {
		this[_private].cursor = value;
		this.onCursor?.(value);
	}

	/**
	 * Anexa uma função de retorno de chamada para ser notificado de alterações no cursor para esta referência. O cursor é atualizado nestas ocasiões:
	 * - Após qualquer um dos seguintes eventos terem ocorrido: `value`, `child_changed`, `child_added`, `child_removed`, `mutations`, `mutated`.
	 * - Após qualquer um destes métodos ter terminado de salvar um valor no banco de dados: `set`, `update`, `transaction`. Se estiver conectado a
	 * um servidor remoto, o cursor é atualizado assim que o valor do servidor for atualizado.
	 */
	onCursor?: (cursor: string | null | undefined) => any;

	get isWildcardPath() {
		return this.path.indexOf("*") >= 0 || this.path.indexOf("$") >= 0;
	}

	/**
	 * O caminho com o qual esta instância foi criada
	 */
	get path(): string {
		return this[_private].path;
	}

	/**
	 * A chave ou índice deste nó
	 */
	get key(): string {
		const key = this[_private].key;
		return typeof key === "number" ? `[${key}]` : key;
	}

	/**
	 * Se a "chave" for um número, é um índice!
	 */
	get index(): number {
		const key = this[_private].key;
		if (typeof key !== "number") {
			throw new Error(`"${key}" is not a number`);
		}
		return key;
	}

	/**
	 * Retorna uma nova referência para o pai deste nó
	 */
	get parent(): DataReference | null {
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
	get vars(): PathVariables {
		return this[_private].vars;
	}

	/**
	 * Retorna uma nova referência para um nó filho
	 * @param childPath Chave de filho, índice ou caminho
	 * @returns Referência para o filho
	 */
	child<Child = any>(childPath: string | number): DataReference<Child> {
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
	async set(value: T, onComplete?: (err: Error, ref: DataReference) => void): Promise<this> {
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
					onComplete(null as any, this);
				} catch (err) {
					console.error("Error in onComplete callback:", err);
				}
			}
		} catch (err: any) {
			if (typeof onComplete === "function") {
				try {
					onComplete(err, this);
				} catch (err) {
					console.error("Error in onComplete callback:", err);
				}
			} else {
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
	async update(updates: Partial<T>, onComplete?: (err: Error, ref: DataReference) => void): Promise<this> {
		try {
			if (this.isWildcardPath) {
				throw new Error(`Cannot update the value of wildcard path "/${this.path}"`);
			}
			if (!this.db.isReady) {
				await this.db.ready();
			}
			if (typeof updates !== "object" || updates instanceof Array || updates instanceof ArrayBuffer || updates instanceof Date) {
				await this.set(updates as any);
			} else if (Object.keys(updates).length === 0) {
				console.warn(`update called on path "/${this.path}", but there is nothing to update`);
			} else {
				updates = this.db.types.serialize(this.path, updates);
				const { cursor } = await this.db.storage.update(this.path, updates, { context: this[_private].context });
				this.cursor = cursor;
			}
			if (typeof onComplete === "function") {
				try {
					onComplete(null as any, this);
				} catch (err) {
					console.error("Error in onComplete callback:", err);
				}
			}
		} catch (err: any) {
			if (typeof onComplete === "function") {
				try {
					onComplete(err, this);
				} catch (err) {
					console.error("Error in onComplete callback:", err);
				}
			} else {
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
	async transaction<Value = T>(callback: (currentValue: DataSnapshot<Value>) => any): Promise<this> {
		if (this.isWildcardPath) {
			throw new Error(`Cannot start a transaction on wildcard path "/${this.path}"`);
		}
		if (!this.db.isReady) {
			await this.db.ready();
		}
		let throwError;
		const cb = (currentValue: any) => {
			currentValue = this.db.types.deserialize(this.path, currentValue);
			const snap = new DataSnapshot(this, currentValue);
			let newValue;
			try {
				newValue = callback(snap);
			} catch (err) {
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
			} else {
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
	on<Val = T>(
		event: ValueEvent | NotifyEvent,
		callback?: EventCallback | boolean | EventSettings | EventCallback<DataSnapshot<Val>> | EventCallback<DataReference<Val>>,
		cancelCallback?: (error: string) => void,
	): EventStream {
		if (this.path === "" && ["value", "child_changed"].includes(event)) {
			// Removidos os eventos 'notify_value' e 'notify_child_changed' da lista, pois eles não exigem mais carregamento adicional de dados.
			console.warn(
				"WARNING: Listening for value and child_changed events on the root node is a bad practice. These events require loading of all data (value event), or potentially lots of data (child_changed event) each time they are fired",
			);
		}

		let eventPublisher: EventPublisher;
		const eventStream = new EventStream((publisher) => {
			eventPublisher = publisher;
		});

		// Mapear NOSSO retorno de chamada para o retorno de chamada original, para que o .off possa remover o(s) retorno(s) de chamada certo(s)
		const cb: IEventSubscription = {
			event,
			stream: eventStream,
			userCallback: typeof callback === "function" ? (callback as any) : undefined,
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
				} else {
					const values = {
						previous: this.db.types.deserialize(path, oldValue),
						current: this.db.types.deserialize(path, newValue),
					};
					if (event === "child_removed") {
						callbackObject = new DataSnapshot(ref, values.previous, true, values.previous, eventContext);
					} else if (event === "mutations") {
						callbackObject = new MutationsDataSnapshot(ref, values.current, eventContext);
					} else {
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
				eventStream.subscribe(callback as any, (activated, cancelReason) => {
					if (!activated) {
						cancelCallback && cancelCallback(cancelReason as any);
					}
				});
			}

			const advancedOptions: EventSettings = typeof callback === "object" ? callback : { newOnly: !callback }; // newOnly: se o retorno de chamada não for 'truthy', poderia alterar isso para (typeof callback !== 'function' && callback !== true), mas isso quebraria o código do cliente que usa um argumento truthy.
			if (typeof advancedOptions.newOnly !== "boolean") {
				advancedOptions.newOnly = false;
			}
			if (this.isWildcardPath) {
				advancedOptions.newOnly = true;
			}
			const cancelSubscription = (err: Error) => {
				// Acesso negado?
				// Cancelar a assinatura
				const callbacks = this[_private].callbacks;
				callbacks.splice(callbacks.indexOf(cb), 1);
				this.db.storage.unsubscribe(this.path, event, cb.ourCallback as any);

				// Chamar cancelCallbacks
				this.db.debug.error(`Subscription "${event}" on path "/${this.path}" canceled because of an error: ${err.message}`);
				eventPublisher.cancel(err.message);
			};
			const authorized = this.db.storage.subscribe(this.path, event, cb.ourCallback as any, {
				newOnly: advancedOptions.newOnly,
				cancelCallback: cancelSubscription,
				syncFallback: advancedOptions.syncFallback as any,
			});
			const allSubscriptionsStoppedCallback = () => {
				const callbacks = this[_private].callbacks;
				callbacks.splice(callbacks.indexOf(cb), 1);
				return this.db.storage.unsubscribe(this.path, event, cb.ourCallback as any);
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
			} else {
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
				} else if (event === "child_added") {
					this.get((snap) => {
						const val = snap.val();
						if (val === null || typeof val !== "object") {
							return;
						}
						Object.keys(val).forEach((key) => {
							const childSnap = new DataSnapshot(this.child(key), val[key as never]);
							eventPublisher.publish(childSnap);
						});
					});
				} else if (event === "notify_child_added") {
					// Use a API de reflexão para obter os filhos atuais.
					// NOTA: Isso não funciona com o IvipBase <= v0.9.7, apenas quando conectado como administrador.
					const step = 100,
						limit = step;
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
		} else {
			this.db.ready(subscribe);
		}

		return eventStream;
	}

	/**
	 * Cancela a inscrição de um evento previamente adicionado
	 * @param event Nome do evento
	 * @param callback Função de retorno de chamada a ser removida
	 * @returns Retorna esta instância de `DataReference`
	 */
	off(event?: ValueEvent, callback?: EventCallback<DataSnapshot>): this;
	off(event?: NotifyEvent, callback?: EventCallback<DataReference>): this;
	off(event?: ValueEvent | NotifyEvent, callback?: EventCallback<DataSnapshot<T>> | EventCallback<this>) {
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
	get<Value = T>(optionsOrCallback?: DataRetrievalOptions | EventCallback<DataSnapshot<Value>>, callback?: EventCallback<DataSnapshot<Value>>): Promise<DataSnapshot<Value>> | void {
		if (!this.db.isReady) {
			const promise = this.db.ready().then(() => this.get(optionsOrCallback, callback) as any);
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
		} else {
			return promise;
		}
	}

	/**
	 * Aguarda a ocorrência de um evento
	 * @param event Nome do evento, por exemplo, "value", "child_added", "child_changed", "child_removed"
	 * @param options Opções de recuperação de dados, para incluir ou excluir chaves específicas de filhos
	 * @returns Retorna uma promise que é resolvida com uma snapshot dos dados
	 */
	once(event: ValueEvent | NotifyEvent, options?: DataRetrievalOptions): Promise<DataSnapshot<T> | void> {
		if (event === "value" && !this.isWildcardPath) {
			// Shortcut, do not start listening for future events
			return this.get(options) as Promise<DataSnapshot>;
		}
		return new Promise((resolve) => {
			const callback: EventCallback<DataSnapshot> = (snap: DataSnapshot) => {
				this.off(event as ValueEvent, callback); // unsubscribe directly
				resolve(snap);
			};
			this.on(event as ValueEvent, callback);
		});
	}

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
	 * @param value Valor opcional para armazenar no banco de dados imediatamente
	 * @param onComplete Função de retorno de chamada opcional para ser executada uma vez que o valor foi armazenado
	 * @returns Retorna uma promise que é resolvida com a referência após o valor passado ter sido armazenado
	 */
	push<Value = any>(value?: Value, onComplete?: (err: Error, ref: DataReference) => void): DataReference<Value | undefined> | Promise<DataReference<Value | undefined>> {
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
		} else {
			return ref;
		}
	}

	/**
	 * Remove este nó e todos os filhos
	 */
	async remove(): Promise<this> {
		if (this.isWildcardPath) {
			throw new Error(`Cannot remove wildcard path "/${this.path}". Use query().remove instead`);
		}
		if (this.parent === null) {
			throw new Error("Cannot remove the root node");
		}
		return this.set(null as any);
	}

	/**
	 * Verifica rapidamente se esta referência possui um valor no banco de dados, sem retornar seus dados
	 * @returns Retorna uma promise que é resolvida com um valor booleano
	 */
	async exists(): Promise<boolean> {
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
	query(): DataReferenceQuery {
		return new DataReferenceQuery(this);
	}

	/**
	 * Obtém o número de filhos que este nó possui, utiliza reflexão
	 */
	async count() {
		const info = await this.reflect("info", { child_count: true });
		return (info.children as { count: number }).count;
	}

	/**
	 * Obtém informações sobre um nó e/ou seus filhos sem recuperar valores de objetos filhos
	 * @param type Tipo de reflexão
	 * @returns Retorna uma promise que é resolvida com as informações de reflexão do nó
	 */
	reflect(
		type: "info",
		args: {
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
		},
	): Promise<ReflectionNodeInfo>;
	/**
	 * @returns Retorna uma promise que é resolvida com as informações de reflexão dos filhos do nó
	 */
	reflect(
		type: "children",
		args: {
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
		},
	): Promise<ReflectionNodeInfo>;

	async reflect(type: ReflectionType, args: any) {
		if (this.isWildcardPath) {
			throw new Error(`Cannot reflect on wildcard path "/${this.path}"`);
		}
		if (!this.db.isReady) {
			await this.db.ready();
		}
		return this.db.storage.reflect(this.path, type, args);
	}

	/**
	 * Exporta o valor deste nó e todos os filhos
	 * @param write Função que escreve dados no seu fluxo
	 * @param options Apenas o formato suportado no momento é json
	 * @returns Retorna uma promise que é resolvida assim que todos os dados forem exportados
	 */
	export(write: StreamWriteFunction, options?: { format?: "json"; type_safe?: boolean }): Promise<void>;
	/**
	 * @deprecated Use a assinatura do método com um argumento de função de gravação de fluxo em vez disso
	 */
	export(stream: IStreamLike, options?: { format?: "json"; type_safe?: boolean }): Promise<void>;
	async export(write: StreamWriteFunction | IStreamLike, options: { format?: "json"; type_safe?: boolean } = { format: "json", type_safe: true }) {
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
	async import(read: StreamReadFunction, options = { format: "json", suppress_events: false }): Promise<void> {
		if (this.isWildcardPath) {
			throw new Error(`Cannot import to wildcard path "/${this.path}"`);
		}
		if (!this.db.isReady) {
			await this.db.ready();
		}
		return this.db.storage.import(this.path, read, options);
	}

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
	 * @param options Opções opcionais iniciais de recuperação de dados.
	 * Não recomendado para uso ainda - os includes/excludes fornecidos não são aplicados às mutações recebidas,
	 * ou ações de sincronização ao usar um IvipBase com banco de dados de cache.
	 */
	observe<T = any>(options?: DataRetrievalOptions): Observable<T> {
		// options não deve ser usado ainda - não podemos prevenir/filtrar eventos de mutação em caminhos excluídos no momento
		if (options) {
			throw new Error("observe does not support data retrieval options yet");
		}

		if (this.isWildcardPath) {
			throw new Error(`Cannot observe wildcard path "/${this.path}"`);
		}
		const Observable = getObservable<T>();
		return new Observable((observer) => {
			let cache: any,
				resolved = false;
			let promise = Promise.all([this.get(options)]).then(([snap]: any) => {
				resolved = true;
				cache = snap.val();
				observer.next(cache);
			});

			const updateCache = (snap: DataSnapshot) => {
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
							// Happens if initial loaded data did not include / excluded this data,
							// or we missed out on an event
							target[key] = typeof trailKeys[0] === "number" ? [] : {};
						}
						target = target[key];
					}
				}
				const prop = trailKeys.shift();
				const newValue = snap.val();
				if (typeof prop === "string" || typeof prop === "number") {
					if (newValue === null) {
						// Remove it
						target instanceof Array && typeof prop === "number" ? target.splice(prop, 1) : delete target[prop];
					} else {
						// Set or update it
						target[prop] = newValue;
					}
				}
				observer.next(cache);
			};

			this.on("mutated", updateCache); // TODO: Refactor to 'mutations' event instead

			// Return unsubscribe function
			return () => {
				this.off("mutated", updateCache);
			};
		});
	}

	/**
	 * Iterate through each child in the referenced collection by streaming them one at a time.
	 * @param callback function to call with a `DataSnapshot` of each child. If your function
	 * returns a `Promise`, iteration will wait until it resolves before loading the next child.
	 * Iterating stops if callback returns (or resolves with) `false`
	 * @returns Returns a Promise that resolves with an iteration summary.
	 * @example
	 * ```js
	 * const result = await db.ref('books').forEach(bookSnapshot => {
	 *   const book = bookSnapshot.val();
	 *   console.log(`Got book "${book.title}": "${book.description}"`);
	 * });
	 *
	 * // In above example we're only using 'title' and 'description'
	 * // of each book. Let's only load those to increase performance:
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
	 * @param options specify what data to load for each child. Eg `{ include: ['title', 'description'] }`
	 * will only load each child's title and description properties
	 */
	forEach<Child = any>(options: DataRetrievalOptions, callback: ForEachIteratorCallback<Child>): Promise<ForEachIteratorResult>;
	async forEach<Child = any>(callbackOrOptions: ForEachIteratorCallback | DataRetrievalOptions, callback?: ForEachIteratorCallback<Child>): Promise<ForEachIteratorResult> {
		let options;
		if (typeof callbackOrOptions === "function") {
			callback = callbackOrOptions;
		} else {
			options = callbackOrOptions;
		}
		if (typeof callback !== "function") {
			throw new TypeError("No callback function given");
		}

		// Get all children through reflection. This could be tweaked further using paging
		const { children } = await this.reflect("children", { limit: 0, skip: 0 }); // Gets ALL child keys

		const summary: ForEachIteratorResult = {
			canceled: false,
			total: children && "list" in children ? children?.list.length : 0,
			processed: 0,
		};

		// Iterate through all children until callback returns false
		if (children && "list" in children) {
			for (let i = 0; i < children.list.length; i++) {
				const key = children.list[i].key;

				// Get child data
				const snapshot = await this.child(key).get(options);
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
		}

		return summary;
	}

	/**
	 * Gets mutations to the referenced path and its children using a previously acquired cursor.
	 * @param cursor cursor to use. When not given all available mutations in the transaction log will be returned.
	 */
	getMutations(cursor?: string | null): Promise<{ used_cursor: string | null; new_cursor: string; mutations: ValueMutation[] }>;
	/**
	 * Gets mutations to the referenced path and its children since a specific date.
	 * @param since Date/time to use. When not given all available mutations in the transaction log will be returned.
	 */
	getMutations(since?: Date): Promise<{ used_cursor: string | null; new_cursor: string; mutations: ValueMutation[] }>;
	async getMutations(cursorOrDate?: string | Date | null): Promise<{ used_cursor: string | null; new_cursor: string; mutations: ValueMutation[] }> {
		const cursor = typeof cursorOrDate === "string" ? cursorOrDate : undefined;
		const timestamp = cursorOrDate === null || typeof cursorOrDate === "undefined" ? 0 : cursorOrDate instanceof Date ? cursorOrDate.getTime() : Date.now();
		return this.db.storage.getMutations({ path: this.path, cursor, timestamp });
	}

	/**
	 * Gets changes to the referenced path and its children using a previously acquired cursor.
	 * @param cursor cursor to use. When not given all available changes in the transaction log will be returned.
	 */
	getChanges(cursor?: string | null): Promise<{ used_cursor: string; new_cursor: string; changes: ValueChange[] }>;
	/**
	 * Gets changes to the referenced path and its children since a specific date.
	 * @param since Date/time to use. When not given all available changes in the transaction log will be returned.
	 */
	getChanges(since?: Date): Promise<{ used_cursor: string | null; new_cursor: string; changes: ValueChange[] }>;
	async getChanges(cursorOrDate?: string | Date | null): Promise<{ used_cursor: string | null; new_cursor: string; changes: ValueChange[] }> {
		const cursor = typeof cursorOrDate === "string" ? cursorOrDate : undefined;
		const timestamp = cursorOrDate === null || typeof cursorOrDate === "undefined" ? 0 : cursorOrDate instanceof Date ? cursorOrDate.getTime() : Date.now();
		return this.db.storage.getChanges({ path: this.path, cursor, timestamp });
	}
}

export class QueryDataRetrievalOptions extends DataRetrievalOptions {
	/**
	 * Whether to return snapshots of matched nodes (include data), or references only (no data). Default is `true`
	 * @default true
	 */
	snapshots?: boolean;

	/**
	 * @param options Options for data retrieval, allows selective loading of object properties
	 */
	constructor(options: QueryDataRetrievalOptions) {
		super(options);
		if (!["undefined", "boolean"].includes(typeof options.snapshots)) {
			throw new TypeError("options.snapshots must be a boolean");
		}
		this.snapshots = typeof options.snapshots === "boolean" ? options.snapshots : true;
	}
}

export class DataSnapshotsArray<T = any> extends Array<DataSnapshot<T>> {
	static from<T = any>(snaps: DataSnapshot<T>[]) {
		const arr = new DataSnapshotsArray<T>(snaps.length);
		snaps.forEach((snap, i) => (arr[i] = snap));
		return arr;
	}
	getValues() {
		return this.map((snap) => snap.val());
	}
}

export class DataReferencesArray<T = any> extends Array<DataReference<T>> {
	static from<T = any>(refs: DataReference<T>[]) {
		const arr = new DataReferencesArray<T>(refs.length);
		refs.forEach((ref, i) => (arr[i] = ref));
		return arr;
	}
	getPaths() {
		return this.map((ref) => ref.path);
	}
}

export class DataReferenceQuery {
	private [_private]: {
		filters: QueryFilter[];
		skip: number;
		take: number;
		order: QueryOrder[];
		events: { [name: string]: RealtimeQueryEventCallback[] };
	};
	ref: DataReference;

	/**
	 * Creates a query on a reference
	 */
	constructor(ref: DataReference) {
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
	 * Applies a filter to the children of the refence being queried.
	 * If there is an index on the property key being queried, it will be used
	 * to speed up the query
	 * @param key property to test value of
	 * @param op operator to use
	 * @param compare value to compare with
	 */
	filter(key: string | number, op: QueryOperator, compare?: any): DataReferenceQuery {
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
	where(key: string | number, op: QueryOperator, compare?: any) {
		return this.filter(key, op, compare);
	}

	/**
	 * Limits the number of query results
	 */
	take(n: number): DataReferenceQuery {
		this[_private].take = n;
		return this;
	}

	/**
	 * Skips the first n query results
	 */
	skip(n: number): DataReferenceQuery {
		this[_private].skip = n;
		return this;
	}

	/**
	 * Sorts the query results
	 * @param key key to sort on
	 */
	sort(key: string): DataReferenceQuery;
	/**
	 * @param ascending whether to sort ascending (default) or descending
	 */
	sort(key: string, ascending: boolean): DataReferenceQuery;
	sort(key: string, ascending = true): DataReferenceQuery {
		if (!["string", "number"].includes(typeof key)) {
			throw "key must be a string or number";
		}
		this[_private].order.push({ key, ascending });
		return this;
	}

	/**
	 * @deprecated use `.sort` instead
	 */
	order(key: string, ascending = true) {
		return this.sort(key, ascending);
	}

	/**
	 * Executes the query
	 * @returns returns a Promise that resolves with an array of DataSnapshots
	 */
	get<T = any>(): Promise<DataSnapshotsArray<T>>;
	/**
	 * Executes the query with additional options
	 * @param options data retrieval options to include or exclude specific child data, and whether to return snapshots (default) or references only
	 * @returns returns a Promise that resolves with an array of DataReferences
	 */
	get<T = any>(options: QueryDataRetrievalOptions & { snapshots: false }): Promise<DataReferencesArray<T>>;
	/**
	 * @returns returns a Promise that resolves with an array of DataSnapshots
	 */
	get<T = any>(options: QueryDataRetrievalOptions & { snapshots?: true }): Promise<DataSnapshotsArray<T>>;
	/**
	 * @returns returns a Promise that resolves with an array of DataReferences or DataSnapshots
	 */
	get<T = any>(options: QueryDataRetrievalOptions): Promise<DataReferencesArray<T> | DataSnapshotsArray<T>>;
	/**
	 * @param callback callback to use instead of returning a promise
	 * @returns returns nothing because a callback is being used
	 */
	get<T = any>(options: QueryDataRetrievalOptions, callback: (snapshots: DataSnapshotsArray<T>) => void): void;
	/**
	 * @returns returns nothing because a callback is being used
	 */
	get<T = any>(options: QueryDataRetrievalOptions, callback: (snapshotsOrReferences: DataSnapshotsArray<T> | DataReferencesArray<T>) => void): void;
	get<T = any>(
		optionsOrCallback?: QueryDataRetrievalOptions | ((results: DataSnapshotsArray<T> | DataReferencesArray<T>) => void),
		callback?: (results: DataSnapshotsArray<T> | DataReferencesArray<T>) => void,
	): Promise<DataSnapshotsArray<T> | DataReferencesArray<T>> | void;
	get<T = any>(
		optionsOrCallback?: QueryDataRetrievalOptions | ((results: DataSnapshotsArray<T> | DataReferencesArray<T>) => void),
		callback?: ((results: DataSnapshotsArray<T> | DataReferencesArray<T>) => void) | ((snapshots: DataSnapshotsArray<T>) => void),
	): Promise<DataSnapshotsArray<T> | DataReferencesArray<T>> | void {
		if (!this.ref.db.isReady) {
			const promise = this.ref.db.ready().then(() => this.get(optionsOrCallback, callback as any) as any);
			return typeof optionsOrCallback !== "function" && typeof callback !== "function" ? promise : undefined; // only return promise if no callback is used
		}

		callback = typeof optionsOrCallback === "function" ? optionsOrCallback : typeof callback === "function" ? callback : undefined;

		const options: QueryOptions = new QueryDataRetrievalOptions(typeof optionsOrCallback === "object" ? optionsOrCallback : { snapshots: true, cache_mode: "allow" });
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
				const eventData: RealtimeQueryEvent = {
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
				} catch (err: any) {
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

		// Stop realtime results if they are still enabled on a previous .get on this instance
		this.stop();

		// NOTE: returning promise here, regardless of callback argument. Good argument to refactor method to async/await soon
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
					(results = <any>res), (context = {});
				}
				if (options.snapshots) {
					const snaps = (results as { path: string; val: any }[]).map<DataSnapshot>((result) => {
						const val = db.types.deserialize(result.path, result.val);
						return new DataSnapshot(db.ref(result.path), val, false, undefined, context);
					});
					return DataSnapshotsArray.from(snaps);
				} else {
					const refs = (results as string[]).map<DataReference>((path) => db.ref(path));
					return DataReferencesArray.from(refs);
				}
			})
			.then((results) => {
				callback && callback(results as any);
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
	getRefs<T = any>(callback?: (references: DataReferencesArray) => void): Promise<DataReferencesArray<T>> | void {
		return this.get<T>({ snapshots: false }, callback as any);
	}

	/**
	 * Executes the query and returns an array of references. Short for `.get({ snapshots: false })`
	 */
	find<T = any>(): Promise<DataReferencesArray<T>> {
		return this.get<T>({ snapshots: false });
	}

	/**
	 * Executes the query and returns the number of results
	 */
	async count(): Promise<number> {
		const refs = await this.find();
		return refs.length;
	}

	/**
	 * Executes the query and returns if there are any results
	 */
	async exists(): Promise<boolean> {
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
	async remove(callback?: (results: QueryRemoveResult[]) => void): Promise<QueryRemoveResult[]> {
		const refs = await this.find();

		// Perform updates on each distinct parent collection (only 1 parent if this is not a wildcard path)
		const parentUpdates = refs.reduce((parents, ref) => {
			if (ref.parent) {
				const parent = parents[ref.parent.path];
				if (!parent) {
					parents[ref.parent.path] = [ref];
				} else {
					parent.push(ref);
				}
			}
			return parents;
		}, {} as Record<string, DataReference[]>);

		const db = this.ref.db;
		const promises = Object.keys(parentUpdates).map(async (parentPath): Promise<QueryRemoveResult> => {
			const updates = refs.reduce((updates, ref) => {
				updates[ref.key] = null;
				return updates;
			}, {} as Record<string, null>);
			const ref = db.ref(parentPath);
			try {
				await ref.update(updates);
				return { ref, success: true };
			} catch (error: any) {
				return { ref, success: false, error };
			}
		});

		const results = await Promise.all(promises);
		callback && callback(results);
		return results;
	}

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
	on(event: string, callback: RealtimeQueryEventCallback | QueryHintsEventCallback | QueryStatsEventCallback) {
		if (!this[_private].events[event]) {
			this[_private].events[event] = [];
		}
		this[_private].events[event].push(callback as any);
		return this;
	}

	/**
	 * Unsubscribes from (a) previously added event(s)
	 * @param event Name of the event
	 * @param callback callback function to remove
	 * @returns returns reference to this query
	 */
	off(event?: "stats" | "hints" | "add" | "change" | "remove", callback?: RealtimeQueryEventCallback): DataReferenceQuery {
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
	async forEach<T = any>(callbackOrOptions: ForEachIteratorCallback<T> | DataRetrievalOptions, callback?: ForEachIteratorCallback<T>): Promise<ForEachIteratorResult> {
		let options;
		if (typeof callbackOrOptions === "function") {
			callback = callbackOrOptions;
		} else {
			options = callbackOrOptions;
		}
		if (typeof callback !== "function") {
			throw new TypeError("No callback function given");
		}

		// Get all query results. This could be tweaked further using paging
		const refs = await this.find();

		const summary: ForEachIteratorResult = {
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
