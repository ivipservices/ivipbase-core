import { SimpleEventEmitter } from './simple-event-emitter';
import { DataReference, DataReferenceQuery } from './data-reference';
import { TypeMappings } from './type-mappings';
import { setObservable } from './optional-observable';
import type { Api } from './api';
import { DebugLogger, LoggingLevel } from './debug';
import { ColorStyle, SetColorsEnabled } from './simple-colors';

export class AceBaseBaseSettings {
    /**
     * Qual nível usar para log do console.
     * @default 'log'
     */
    logLevel: LoggingLevel = 'log';

    /**
     * Se deve usar cores na saída de logs do console
     * @default true
     */
    logColors = true;

    /**
     * @internal (para uso interno)
     */
    info = 'realtime database';

    /**
     * You can turn this on if you are a sponsor.
     */
    sponsor = false;

    constructor(options: Partial<AceBaseBaseSettings>) {
        if (typeof options !== 'object') { options = {}; }
        if (typeof options.logLevel === 'string') { this.logLevel = options.logLevel; }
        if (typeof options.logColors === 'boolean') { this.logColors = options.logColors; }
        if (typeof options.info === 'string') { this.info = options.info; }
        if (typeof options.sponsor === 'boolean') { this.sponsor = options.sponsor; }
    }
}

export abstract class AceBaseBase extends SimpleEventEmitter {
    protected _ready = false;

    /**
     * @internal (para uso interno)
     */
    api: Api;

    /**
     * @internal (para uso interno)
     */
    debug: DebugLogger;

    /**
     * Mapeamentos de tipos
     */
    types: TypeMappings;

    readonly name: string;

    /**
     * @param dbname Nome do banco de dados para abrir ou criar, no caso, o nome da coleção no MongoDB
     */
    constructor(dbname: string, options: Partial<AceBaseBaseSettings> = {}) {
        super();
        options = new AceBaseBaseSettings(options);

        this.name = dbname;

        // Log do console de configuração
        this.debug = new DebugLogger(options.logLevel, `[${dbname}]`);

        // Ativar/desativar registro com cores
        SetColorsEnabled(options.logColors);

        // ASCI art: http://patorjk.com/software/taag/#p=display&f=Doom&t=AceBase
        // const logoStyle = [ColorStyle.magenta, ColorStyle.bold];
        // const logo =
        //     '     ___          ______                ' + '\n' +
        //     '    / _ \\         | ___ \\               ' + '\n' +
        //     '   / /_\\ \\ ___ ___| |_/ / __ _ ___  ___ ' + '\n' +
        //     '   |  _  |/ __/ _ \\ ___ \\/ _` / __|/ _ \\' + '\n' +
        //     '   | | | | (_|  __/ |_/ / (_| \\__ \\  __/' + '\n' +
        //     '   \\_| |_/\\___\\___\\____/ \\__,_|___/\\___|';

        // const info = (options.info ? ''.padStart(40 - options.info.length, ' ') + options.info + '\n' : '');

        // if (!options.sponsor) {
        //     // if you are a sponsor, you can switch off the "AceBase banner ad"
        //     this.debug.write(logo.colorize(logoStyle));
        //     info && this.debug.write(info.colorize(ColorStyle.magenta));
        // }

        // Funcionalidade de mapeamento de tipo de configuração
        this.types = new TypeMappings(this);

        this.once('ready', () => {
            // console.log(`banco de dados "${dbname}" (${this.constructor.name}) está pronto para uso`);
            this._ready = true;
        });
    }

    /**
     * Aguarda o banco de dados estar pronto antes de executar o callback.
     * @param callback (opcional) função de callback que é chamada quando o banco de dados está pronto para ser usado. Você também pode usar a promessa retornada.
     * @returns retorna uma promessa que é resolvida quando o banco de dados está pronto
     */
    async ready(callback?: () => void) {
        if (!this._ready) {
            // Wait for ready event
            await new Promise(resolve => this.on('ready', resolve));
        }
        callback?.();
    }

    get isReady() {
        return this._ready;
    }

    /**
     * Permite o uso de uma implementação específica de observável
     * @param ObservableImpl Implementação a ser utilizada
     */
    setObservable(ObservableImpl: any): void {
        setObservable(ObservableImpl);
    }

    /**
     * Cria uma referência a um nó
     * @param path
     * @returns referência ao nó solicitado
     */
    ref<T = any>(path: string): DataReference<T> {
        return new DataReference(this, path);
    }

    /**
     * Obtenha uma referência para o nó raiz do banco de dados
     * @returns referência para o nó raiz
     */
    get root(): DataReference {
        return this.ref('');
    }

    /**
     * Cria uma consulta no nó solicitado
     * @param path
     * @returns consulta para o nó solicitado
     */
    query(path: string): DataReferenceQuery {
        const ref = new DataReference(this, path);
        return new DataReferenceQuery(ref);
    }

    get indexes() {
        return {
            /**
             * Obtém todos os índices
             */
            get: () => {
                return this.api.getIndexes();
            },
            /**
             * Cria um índice em "key" para todos os nós filhos em "path". Se o índice já existir, nada acontece.
             * Exemplo: criar um índice em todas as chaves "name" dos objetos filhos do caminho "system/users",
             * indexará "system/users/user1/name", "system/users/user2/name", etc.
             * Você também pode usar caminhos com caracteres curinga para permitir indexação e consulta de dados fragmentados.
             * Exemplo: caminho "users/*\/posts", chave "title": indexará todas as chaves "title" em todos os posts de todos os usuários.
             * @param path caminho para o nó contêiner
             * @param key nome da chave para indexar todos os nós filhos do contêiner
             * @param options quaisquer opções adicionais
             */
            create: (
                path: string,
                key: string,
                options?: {
                    /** tipo de índice a ser criado, como `fulltext`, `geo`, `array` ou `normal` (padrão) */
                    type?: string;
                    /** se deve reconstruir o índice se já existir */
                    rebuild?: boolean;
                    /** chaves a serem incluídas no índice. Acelera a classificação nessas colunas quando o índice é usado (e aumenta drasticamente a velocidade da consulta quando .take(n) também é usado) */
                    include?: string[];
                    /** Se os valores indexados forem strings, qual localidade padrão usar */
                    textLocale?: string;
                    /** configurações adicionais específicas do índice */
                    config?: any;
                }) => {
                return this.api.createIndex(path, key, options);
            },
            /**
             * Exclui um índice existente do banco de dados
             */
            delete: async (filePath: string) => {
                return this.api.deleteIndex(filePath);
            },
        };
    }

    get schema() {
        return {
            get: (path: string) => {
                return this.api.getSchema(path);
            },
            set: (path: string, schema: Record<string, unknown>|string, warnOnly = false) => {
                return this.api.setSchema(path, schema, warnOnly);
            },
            all: () => {
                return this.api.getSchemas();
            },
            check: (path: string, value: unknown, isUpdate: boolean) => {
                return this.api.validateSchema(path, value, isUpdate);
            },
        };
    }
}