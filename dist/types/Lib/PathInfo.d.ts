export declare class PathReference {
    path: string;
    /**
     * Cria uma referência a um caminho que pode ser armazenado no banco de dados. Use isso para criar referências cruzadas para outros dados em seu banco de dados.
     * @param path
     */
    constructor(path: string);
}
export declare class PathInfo {
    static get(path: string | Array<string | number>): PathInfo;
    static getChildPath(path: string, childKey: string | number): string;
    static getPathKeys(path: string): Array<string | number>;
    readonly path: string;
    readonly keys: Array<string | number>;
    constructor(path: string | Array<string | number>);
    get key(): string | number | null;
    get parent(): PathInfo | null;
    get parentPath(): string | null;
    child(childKey: string | number | Array<string | number>): PathInfo;
    childPath(childKey: string | number | Array<string | number>): string;
    get pathKeys(): Array<string | number>;
    /**
     * Se varPath contiver variáveis ou wildcards, ele as retornará com os valores encontrados em fullPath
     * @param {string} varPath caminho contendo variáveis como * e $name
     * @param {string} fullPath caminho real para um nó
     * @returns {{ [index: number]: string|number, [variable: string]: string|number }} retorna um objeto semelhante a uma matriz com todos os valores de variáveis. Todas as variáveis nomeadas também são definidas no objeto pelo nome delas (por exemplo, vars.uid e vars.$uid)
     * @example
     * PathInfo.extractVariables('users/$uid/posts/$postid', 'users/ewout/posts/post1/title') === {
     *  0: 'ewout',
     *  1: 'post1',
     *  uid: 'ewout', // ou $uid
     *  postid: 'post1' // ou $postid
     * };
     *
     * PathInfo.extractVariables('users/*\/posts/*\/$property', 'users/ewout/posts/post1/title') === {
     *  0: 'ewout',
     *  1: 'post1',
     *  2: 'title',
     *  property: 'title' // ou $property
     * };
     *
     * PathInfo.extractVariables('users/$user/friends[*]/$friend', 'users/dora/friends[4]/diego') === {
     *  0: 'dora',
     *  1: 4,
     *  2: 'diego',
     *  user: 'dora', // ou $user
     *  friend: 'diego' // ou $friend
     * };
     */
    static extractVariables(varPath: string, fullPath: string): any;
    /**
     * Se varPath contiver variáveis ou wildcards, ele retornará um caminho com as variáveis substituídas pelas chaves encontradas em fullPath.
     * @example
     * PathInfo.fillVariables('users/$uid/posts/$postid', 'users/ewout/posts/post1/title') === 'users/ewout/posts/post1'
     */
    static fillVariables(varPath: string, fullPath: string): string;
    /**
     * Substitui todas as variáveis em um caminho pelos valores no argumento vars
     * @param varPath caminho contendo variáveis
     * @param vars objeto de variáveis, como aquele obtido a partir de PathInfo.extractVariables
     */
    static fillVariables2(varPath: string, vars: any): string;
    /**
     * Verifica se um caminho dado corresponde a este caminho, por exemplo, "posts/*\/title" corresponde a "posts/12344/title" e "users/123/name" corresponde a "users/$uid/name"
     */
    equals(otherPath: string | PathInfo): boolean;
    /**
     * Verifica se um caminho dado é um ancestral, por exemplo, "posts" é um ancestral de "posts/12344/title"
     */
    isAncestorOf(descendantPath: string | PathInfo): boolean;
    /**
     * Verifica se um caminho dado é um descendente, por exemplo, "posts/1234/title" é um descendente de "posts"
     */
    isDescendantOf(ancestorPath: string | PathInfo): boolean;
    /**
     * Verifica se o outro caminho está na mesma trilha que este caminho. Caminhos estão na mesma trilha se compartilharem um
     * ancestral comum. Por exemplo, "posts" está na trilha de "posts/1234/title" e vice-versa.
     */
    isOnTrailOf(otherPath: string | PathInfo): boolean;
    /**
     * Verifica se um determinado caminho é um filho direto, por exemplo, "posts/1234/title" é um filho de "posts/1234"
     */
    isChildOf(otherPath: string | PathInfo): boolean;
    /**
     * Verifica se um determinado caminho é seu pai, por exemplo, "posts/1234" é o pai de "posts/1234/title"
     */
    isParentOf(otherPath: string | PathInfo): boolean;
}
export default PathInfo;
//# sourceMappingURL=PathInfo.d.ts.map