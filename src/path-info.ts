function getPathKeys(path: string): Array<string|number> {
    path = path.replace(/\[/g, '/[').replace(/^\/+/, '').replace(/\/+$/, ''); // Substitua [ por /[, remova barras iniciais, remova barras finais
    if (path.length === 0) { return []; }
    const keys = path.split('/');
    return keys.map(key => {
        return key.startsWith('[') ? parseInt(key.slice(1, -1)) : key;
    });
}

export class PathInfo {
    static get(path: string|Array<string|number>): PathInfo {
        return new PathInfo(path);
    }
    static getChildPath(path: string, childKey: string|number): string {
        // retorna getChildPath(path, childKey);
        return PathInfo.get(path).child(childKey).path;
    }
    static getPathKeys(path: string): Array<string|number> {
        return getPathKeys(path);
    }

    readonly path: string;
    readonly keys: Array<string|number>;
    constructor(path: string|Array<string|number>) {
        if (typeof path === 'string') {
            this.keys = getPathKeys(path);
        }
        else if (path instanceof Array) {
            this.keys = path;
        }
        this.path = this.keys.reduce((path, key, i) => i === 0 ? `${key}` : typeof key === 'string' ? `${path}/${key}` : `${path}[${key}]`, '') as string;
    }
    get key(): string|number {
        return this.keys.length === 0 ? null : this.keys.slice(-1)[0];
    }
    get parent() {
        if (this.keys.length == 0) { return null; }
        const parentKeys = this.keys.slice(0, -1);
        return new PathInfo(parentKeys);
    }
    get parentPath(): string {
        return this.keys.length === 0 ? null : this.parent.path;
    }
    child(childKey: string|number|Array<string|number>) {
        if (typeof childKey === 'string') {
            if (childKey.length === 0) { throw new Error(`child key for path "${this.path}" cannot be empty`); }
            // Permite a expansão de um caminho de filho (por exemplo, "user/name") em um `child('user').child('name')` equivalente.
            const keys = getPathKeys(childKey);
            keys.forEach(key => {
                // Verifique as regras de chave do AceBase aqui para que sejam aplicadas independentemente do destino de armazenamento.
                // Isso evita que chaves específicas sejam permitidas em um ambiente (por exemplo, navegador), mas depois
                // sejam recusadas ao sincronizar com um banco de dados binário do AceBase. Corrige o problema https://github.com/appy-one/acebase/issues/172
                if (typeof key !== 'string') { return; }
                if (/[\x00-\x08\x0b\x0c\x0e-\x1f/[\]\\]/.test(key)) {
                    throw new Error(`Invalid child key "${key}" for path "${this.path}". Keys cannot contain control characters or any of the following characters: \\ / [ ]`);
                }
                if (key.length > 128) { throw new Error(`child key "${key}" for path "${this.path}" is too long. Max key length is 128`); }
                if (key.length === 0) { throw new Error(`child key for path "${this.path}" cannot be empty`); }
            });
            childKey = keys;
        }
        return new PathInfo(this.keys.concat(childKey));
    }
    childPath(childKey: string|number|Array<string|number>): string {
        return this.child(childKey).path;
    }
    get pathKeys(): Array<string|number> {
        return this.keys;
    }

    /**
     * Se varPath contiver variáveis ou wildcards, retornará os valores encontrados em fullPath.
     * @param {string} varPath caminho contendo variáveis como * e $name.
     * @param {string} fullPath caminho real para um nó.
     * @returns {{ [index: number]: string|number, [variable: string]: string|number }} retorna um objeto semelhante a um array com todos os valores das variáveis. Todas as variáveis nomeadas também são definidas no array pelo nome delas (por exemplo, vars.uid e vars.$uid).
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
    static extractVariables(varPath: string, fullPath: string): any {
        if (!varPath.includes('*') && !varPath.includes('$')) {
            return [];
        }
        // if (!this.equals(fullPath)) {
        //     throw new Error(`path does not match with the path of this PathInfo instance: info.equals(path) === false!`)
        // }
        const keys = getPathKeys(varPath);
        const pathKeys = getPathKeys(fullPath);
        let count = 0;
        const variables = {
            get length() { return count; },
        } as { readonly length: number; [variable: string]: string | number };
        keys.forEach((key, index) => {
            const pathKey = pathKeys[index];
            if (key === '*') {
                variables[count++] = pathKey;
            }
            else if (typeof key === 'string' && key[0] === '$') {
                variables[count++] = pathKey;
                // Define a propriedade $variable
                variables[key] = pathKey;
                // Defina o nome da propriedade amigável (sem $)
                const varName = key.slice(1);
                if (typeof variables[varName] === 'undefined') {
                    variables[varName] = pathKey;
                }
            }
        });
        return variables;
    }

    /**
     * Se varPath contém variáveis ou wildcards, ele retorna um caminho com as variáveis substituídas pelas chaves encontradas em fullPath.
     * @example
     * PathInfo.fillVariables('users/$uid/posts/$postid', 'users/ewout/posts/post1/title') === 'users/ewout/posts/post1'
     */
    static fillVariables(varPath: string, fullPath: string): string {
        if (varPath.indexOf('*') < 0 && varPath.indexOf('$') < 0) {
            return varPath;
        }
        const keys = getPathKeys(varPath);
        const pathKeys = getPathKeys(fullPath);
        const merged = keys.map((key, index) => {
            if (key === pathKeys[index] || index >= pathKeys.length) {
                return key;
            }
            else if (typeof key === 'string' && (key === '*' || key[0] === '$')) {
                return pathKeys[index];
            }
            else {
                throw new Error(`Path "${fullPath}" cannot be used to fill variables of path "${varPath}" because they do not match`);
            }
        });
        let mergedPath = '';
        merged.forEach(key => {
            if (typeof key === 'number') {
                mergedPath += `[${key}]`;
            }
            else {
                if (mergedPath.length > 0) { mergedPath += '/'; }
                mergedPath += key;
            }
        });
        return mergedPath;
    }

    /**
     * Substitui todas as variáveis em um caminho pelos valores no argumento vars.
     * @param varPath caminho contendo variáveis
     * @param vars objeto de variáveis obtido de PathInfo.extractVariables
     */
    static fillVariables2(varPath: string, vars: any): string {
        if (typeof vars !== 'object' || Object.keys(vars).length === 0) {
            return varPath; // Nothing to fill
        }
        const pathKeys = getPathKeys(varPath);
        let n = 0;
        const targetPath = pathKeys.reduce<string>((path, key) => {
            if (typeof key === 'string' && (key === '*' || key.startsWith('$'))) {
                return PathInfo.getChildPath(path, vars[n++]);
            }
            else {
                return PathInfo.getChildPath(path, key);
            }
        }, '');
        return targetPath;
    }

    /**
     * Verifica se um determinado caminho corresponde a este caminho, por exemplo, "posts/*\/title" corresponde a "posts/12344/title" e "users/123/name" corresponde a "users/$uid/name"
     */
    equals(otherPath: string|PathInfo): boolean {
        const other = otherPath instanceof PathInfo ? otherPath : new PathInfo(otherPath);
        if (this.path === other.path) { return true; } // they are identical
        if (this.keys.length !== other.keys.length) { return false; }
        return this.keys.every((key, index) => {
            const otherKey = other.keys[index];
            return otherKey === key
                || (typeof otherKey === 'string' && (otherKey === '*' || otherKey[0] === '$'))
                || (typeof key === 'string' && (key === '*' ||  key[0] === '$'));
        });
    }

    /**
     * Verifica se um determinado caminho é um ancestral, por exemplo, "posts" é um ancestral de "posts/12344/title"
     */
    isAncestorOf(descendantPath: string|PathInfo): boolean {
        const descendant = descendantPath instanceof PathInfo ? descendantPath : new PathInfo(descendantPath);
        if (descendant.path === '' || this.path === descendant.path) { return false; }
        if (this.path === '') { return true; }
        if (this.keys.length >= descendant.keys.length) { return false; }
        return this.keys.every((key, index) => {
            const otherKey = descendant.keys[index];
            return otherKey === key
                || (typeof otherKey === 'string' && (otherKey === '*' || otherKey[0] === '$'))
                || (typeof key === 'string' && (key === '*' ||  key[0] === '$'));
        });
    }

    /**
     * Verifica se um determinado caminho é um descendente, por exemplo, "posts/1234/title" é um descendente de "posts"
     */
    isDescendantOf(ancestorPath: string|PathInfo): boolean {
        const ancestor = ancestorPath instanceof PathInfo ? ancestorPath : new PathInfo(ancestorPath);
        if (this.path === '' || this.path === ancestor.path) { return false; }
        if (ancestorPath === '') { return true; }
        if (ancestor.keys.length >= this.keys.length) { return false; }
        return ancestor.keys.every((key, index) => {
            const otherKey = this.keys[index];
            return otherKey === key
                || (typeof otherKey === 'string' && (otherKey === '*' || otherKey[0] === '$'))
                || (typeof key === 'string' && (key === '*' ||  key[0] === '$'));
        });
    }

    /**
     * Verifica se o outro caminho está na mesma trilha que este caminho. Caminhos estão na mesma trilha se compartilham um ancestral comum. Por exemplo, "posts" está na trilha de "posts/1234/title" e vice-versa.
     */
    isOnTrailOf(otherPath: string|PathInfo): boolean {
        const other = otherPath instanceof PathInfo ? otherPath : new PathInfo(otherPath);
        if (this.path.length === 0 || other.path.length === 0) { return true; }
        if (this.path === other.path) { return true; }
        return this.pathKeys.every((key, index) => {
            if (index >= other.keys.length) { return true; }
            const otherKey = other.keys[index];
            return otherKey === key
                || (typeof otherKey === 'string' && (otherKey === '*' || otherKey[0] === '$'))
                || (typeof key === 'string' && (key === '*' ||  key[0] === '$'));
        });
    }

    /**
     * Verifica se um determinado caminho é um filho direto, por exemplo, "posts/1234/title" é um filho de "posts/1234"
     */
    isChildOf(otherPath: string|PathInfo): boolean {
        const other = otherPath instanceof PathInfo ? otherPath : new PathInfo(otherPath);
        if (this.path === '') { return false; } // Se o nosso caminho for a raiz, ele não é filho de ninguém...
        return this.parent.equals(other);
    }

    /**
     * Verifica se um determinado caminho é o pai, por exemplo, "posts/1234" é o pai de "posts/1234/title"
     */
    isParentOf(otherPath: string|PathInfo): boolean {
        const other = otherPath instanceof PathInfo ? otherPath : new PathInfo(otherPath);
        if (other.path === '') { return false; } // Se o outro caminho for a raiz, este caminho não pode ser seu pai
        return this.equals(other.parent);
    }
}