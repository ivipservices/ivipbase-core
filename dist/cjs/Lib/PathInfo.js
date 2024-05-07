"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PathInfo = exports.PathReference = void 0;
class PathReference {
    /**
     * Cria uma referência a um caminho que pode ser armazenado no banco de dados. Use isso para criar referências cruzadas para outros dados em seu banco de dados.
     * @param path
     */
    constructor(path) {
        this.path = path;
    }
}
exports.PathReference = PathReference;
function getPathKeys(path) {
    path = path.replace(/\[/g, "/[").replace(/^\/+/, "").replace(/\/+$/, ""); // Substitua `[` por `/[`, remova barras invertidas iniciais, remova barras invertidas finais
    if (path.length === 0) {
        return [""];
    }
    const keys = ["", ...path.split("/")];
    return keys.map((key) => {
        return key.startsWith("[") ? parseInt(key.slice(1, -1)) : key;
    });
}
class PathInfo {
    static get(path) {
        return new PathInfo(path);
    }
    static getChildPath(path, childKey) {
        // return getChildPath(path, childKey);
        return PathInfo.get(path).child(childKey).path;
    }
    static getPathKeys(path) {
        return getPathKeys(path);
    }
    constructor(path) {
        if (typeof path === "string") {
            this.keys = getPathKeys(path);
        }
        else if (path instanceof Array) {
            this.keys = Array.prototype.concat.apply([], path
                .map((k) => (typeof k === "string" ? getPathKeys(k) : k instanceof PathInfo ? k.keys : [k]))
                .map((k) => {
                k.splice(0, k.findIndex((k) => String(k).trim() !== ""));
                return k;
            }));
        }
        else {
            this.keys = [""];
        }
        this.keys.splice(0, this.keys.findIndex((k) => String(k).trim() !== ""));
        this.path = this.keys.reduce((path, key, i) => (i === 0 ? `${key}` : typeof key === "string" ? `${path}/${key}` : `${path}[${key}]`), "").replace(/^\//gi, "");
    }
    get key() {
        return this.keys.length === 0 ? null : this.keys.slice(-1)[0];
    }
    get parent() {
        if (this.keys.length == 0) {
            return null;
        }
        const parentKeys = this.keys.slice(0, -1);
        return new PathInfo(parentKeys);
    }
    get parentPath() {
        var _a, _b;
        return this.keys.length === 0 ? null : (_b = (_a = this.parent) === null || _a === void 0 ? void 0 : _a.path) !== null && _b !== void 0 ? _b : null;
    }
    child(childKey) {
        if (typeof childKey === "string") {
            if (childKey.length === 0) {
                throw new Error(`child key for path "${this.path}" cannot be empty`);
            }
            // Permitir a expansão de um caminho filho (por exemplo, "user/name") para o equivalente a `child('user').child('name')`
            const keys = getPathKeys(childKey);
            keys.forEach((key, index) => {
                // Verifique as regras de chave do IvipBase aqui para que sejam aplicadas independentemente do destino de armazenamento.
                // Isso impede que chaves específicas sejam permitidas em um ambiente (por exemplo, navegador), mas depois
                // recusadas ao sincronizar com um banco de dados binário IvipBase.
                if (typeof key !== "string") {
                    return;
                }
                if (/[\x00-\x08\x0b\x0c\x0e-\x1f/[\]\\]/.test(key)) {
                    throw new Error(`Invalid child key "${key}" for path "${this.path}". Keys cannot contain control characters or any of the following characters: \\ / [ ]`);
                }
                if (key.length > 128) {
                    throw new Error(`child key "${key}" for path "${this.path}" is too long. Max key length is 128`);
                }
                if (index !== 0 && key.length === 0) {
                    throw new Error(`child key for path "${this.path}" cannot be empty`);
                }
            });
            childKey = keys;
        }
        if (Array.isArray(childKey) && childKey[0] === "")
            childKey.shift();
        return new PathInfo(this.keys.concat(childKey).filter((key, i, l) => (key === "" ? i === 0 : true)));
    }
    childPath(childKey) {
        return this.child(childKey).path;
    }
    get pathKeys() {
        return this.keys;
    }
    static variablesKeys(varPath) {
        let count = 0;
        const variables = [];
        if (!varPath.includes("*") && !varPath.includes("$")) {
            return variables;
        }
        getPathKeys(varPath).forEach((key) => {
            if (key === "*") {
                variables.push(count++);
            }
            else if (typeof key === "string" && key[0] === "$") {
                variables.push(count++);
                variables.push(key);
                variables.push(key.slice(1));
            }
        });
        return variables;
    }
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
    static extractVariables(varPath, fullPath) {
        let count = 0;
        const variables = {
            get length() {
                return count;
            },
        };
        if (!varPath.includes("*") && !varPath.includes("$")) {
            return variables;
        }
        if (!this.get(varPath).equals(this.fillVariables(varPath, fullPath))) {
            return variables;
        }
        const keys = getPathKeys(varPath);
        const pathKeys = getPathKeys(fullPath);
        keys.forEach((key, index) => {
            const pathKey = pathKeys[index];
            if (key === "*") {
                variables[count++] = pathKey;
            }
            else if (typeof key === "string" && key[0] === "$") {
                variables[count++] = pathKey;
                // Set the $variable property
                variables[key] = pathKey;
                // Set friendly property name (without $)
                const varName = key.slice(1);
                if (typeof variables[varName] === "undefined") {
                    variables[varName] = pathKey;
                }
            }
        });
        return variables;
    }
    /**
     * Se varPath contiver variáveis ou wildcards, ele retornará um caminho com as variáveis substituídas pelas chaves encontradas em fullPath.
     * @example
     * PathInfo.fillVariables('users/$uid/posts/$postid', 'users/ewout/posts/post1/title') === 'users/ewout/posts/post1'
     */
    static fillVariables(varPath, fullPath) {
        if (varPath.indexOf("*") < 0 && varPath.indexOf("$") < 0) {
            return varPath;
        }
        const keys = getPathKeys(varPath);
        const pathKeys = getPathKeys(fullPath);
        const merged = keys.map((key, index) => {
            if (key === pathKeys[index] || index >= pathKeys.length) {
                return key;
            }
            else if (typeof key === "string" && (key === "*" || key[0] === "$")) {
                return pathKeys[index];
            }
            else {
                throw new Error(`Path "${fullPath}" cannot be used to fill variables of path "${varPath}" because they do not match`);
            }
        });
        let mergedPath = "";
        merged.forEach((key) => {
            if (typeof key === "number") {
                mergedPath += `[${key}]`;
            }
            else {
                if (mergedPath.length > 0) {
                    mergedPath += "/";
                }
                mergedPath += key;
            }
        });
        return mergedPath;
    }
    /**
     * Substitui todas as variáveis em um caminho pelos valores no argumento vars
     * @param varPath caminho contendo variáveis
     * @param vars objeto de variáveis, como aquele obtido a partir de PathInfo.extractVariables
     */
    static fillVariables2(varPath, vars) {
        if (typeof vars !== "object" || Object.keys(vars).length === 0) {
            return varPath; // Nothing to fill
        }
        const pathKeys = getPathKeys(varPath);
        let n = 0;
        const targetPath = pathKeys.reduce((path, key) => {
            if (typeof key === "string" && (key === "*" || key.startsWith("$"))) {
                return PathInfo.getChildPath(path, vars[n++]);
            }
            else {
                return PathInfo.getChildPath(path, key);
            }
        }, "");
        return targetPath;
    }
    /**
     * Verifica se um caminho dado corresponde a este caminho, por exemplo, "posts/*\/title" corresponde a "posts/12344/title" e "users/123/name" corresponde a "users/$uid/name"
     */
    equals(otherPath) {
        const other = otherPath instanceof PathInfo ? otherPath : new PathInfo(otherPath);
        if (this.path === other.path) {
            return true;
        } // they are identical
        if (this.keys.length !== other.keys.length) {
            return false;
        }
        return this.keys.every((key, index) => {
            const otherKey = other.keys[index];
            return otherKey === key || (typeof otherKey === "string" && (otherKey === "*" || otherKey[0] === "$")) || (typeof key === "string" && (key === "*" || key[0] === "$"));
        });
    }
    /**
     * Verifica se um caminho dado é um ancestral, por exemplo, "posts" é um ancestral de "posts/12344/title"
     */
    isAncestorOf(descendantPath) {
        const descendant = descendantPath instanceof PathInfo ? descendantPath : new PathInfo(descendantPath);
        if (descendant.path === "" || this.path === descendant.path) {
            return false;
        }
        if (this.path === "") {
            return true;
        }
        if (this.keys.length >= descendant.keys.length) {
            return false;
        }
        return this.keys.every((key, index) => {
            const otherKey = descendant.keys[index];
            return otherKey === key || (typeof otherKey === "string" && (otherKey === "*" || otherKey[0] === "$")) || (typeof key === "string" && (key === "*" || key[0] === "$"));
        });
    }
    /**
     * Verifica se um caminho dado é um descendente, por exemplo, "posts/1234/title" é um descendente de "posts"
     */
    isDescendantOf(ancestorPath) {
        const ancestor = ancestorPath instanceof PathInfo ? ancestorPath : new PathInfo(ancestorPath);
        if (this.path === "" || this.path === ancestor.path) {
            return false;
        }
        if (ancestorPath === "") {
            return true;
        }
        if (ancestor.keys.length >= this.keys.length) {
            return false;
        }
        return ancestor.keys.every((key, index) => {
            const otherKey = this.keys[index];
            return otherKey === key || (typeof otherKey === "string" && (otherKey === "*" || otherKey[0] === "$")) || (typeof key === "string" && (key === "*" || key[0] === "$"));
        });
    }
    /**
     * Verifica se o outro caminho está na mesma trilha que este caminho. Caminhos estão na mesma trilha se compartilharem um
     * ancestral comum. Por exemplo, "posts" está na trilha de "posts/1234/title" e vice-versa.
     */
    isOnTrailOf(otherPath) {
        const other = otherPath instanceof PathInfo ? otherPath : new PathInfo(otherPath);
        if (this.path.length === 0 || other.path.length === 0) {
            return true;
        }
        if (this.path === other.path) {
            return true;
        }
        return this.pathKeys.every((key, index) => {
            if (index >= other.keys.length) {
                return true;
            }
            const otherKey = other.keys[index];
            return otherKey === key || (typeof otherKey === "string" && (otherKey === "*" || otherKey[0] === "$")) || (typeof key === "string" && (key === "*" || key[0] === "$"));
        });
    }
    /**
     * Verifica se um determinado caminho é um filho direto, por exemplo, "posts/1234/title" é um filho de "posts/1234"
     */
    isChildOf(otherPath) {
        var _a, _b;
        const other = otherPath instanceof PathInfo ? otherPath : new PathInfo(otherPath);
        if (this.path === "") {
            return false;
        } // Se nosso caminho for a raiz, ele não é filho de ninguém...
        return (_b = (_a = this.parent) === null || _a === void 0 ? void 0 : _a.equals(other)) !== null && _b !== void 0 ? _b : false;
    }
    /**
     * Verifica se um determinado caminho é seu pai, por exemplo, "posts/1234" é o pai de "posts/1234/title"
     */
    isParentOf(otherPath) {
        const other = otherPath instanceof PathInfo ? otherPath : new PathInfo(otherPath);
        if (other.path === "" || !other.parent) {
            return false;
        } // Verifica se um determinado caminho é seu pai, por exemplo, "posts/1234" é o pai de "posts/1234/title"
        return this.equals(other.parent);
    }
}
exports.PathInfo = PathInfo;
exports.default = PathInfo;
//# sourceMappingURL=PathInfo.js.map