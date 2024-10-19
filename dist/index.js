"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commentRegex = new RegExp(/(--[^\n]*|#.*|\/\*[\s\S]*?\*\/)/gm);
const literalsRegex = new RegExp(/(".*?(?<!\\)"|'.*?(?<!\\)'|`.*?`)/gs);
const whitespaceRegex = new RegExp(/\s*(\,|\`|\'|\"|\+|\-|\=|\:|\=|\*|\;|\@|\<\=?|\>\=?|\(|\)|`AS|`AND|`ORDER|`WHERE|`FROM|AS`|AND`|ORDER`|WHERE`|FROM`)\s*/g);
const parenKeywordsRegex = new RegExp(/\)\s+(AS|AND|ORDER|WHERE|FROM)\s+\(/g);
const restoreLiteralsRegex = new RegExp(/\!\$LIT(\d+)\!\$/g);
const removeWhitespaceAroundLiterals = new RegExp(/\s*(!\$LIT\d{1,5}!\$)\s*/g);
class MySQLMinifier {
    constructor(isCaching = false, cacheLimit = 100, cachePurgeTime) {
        this.isCaching = isCaching;
        this.cacheLimit = cacheLimit;
        if (this.isCaching) {
            this.cache = new LRUCache(cacheLimit);
            if ((typeof cachePurgeTime === `number`) && (cachePurgeTime > 1)) {
                setInterval(this.cache.clear.bind(this.cache), cachePurgeTime * 1000);
            }
        }
    }
    minify(query) {
        if (this.isCaching) {
            const cachedQuery = this.cache.get(query);
            if (cachedQuery) {
                return cachedQuery;
            }
        }
        const literals = [];
        let transformedQuery = query.replace(literalsRegex, match => {
            literals.push(match);
            return `!$LIT${literals.length - 1}!$`;
        });
        transformedQuery = transformedQuery.replace(commentRegex, '');
        transformedQuery = transformedQuery.replace(literalsRegex, match => `<${match}>`);
        transformedQuery = transformedQuery.replace(/\s+/g, ' ');
        transformedQuery = transformedQuery.replace(/<('.*?'|".*?"|`.*?`|\?.*?|:\w+)>/g, match => match.slice(1, -1));
        transformedQuery = transformedQuery.replace(whitespaceRegex, '$1');
        transformedQuery = transformedQuery.replace(parenKeywordsRegex, ')$1(');
        transformedQuery = transformedQuery.replace(removeWhitespaceAroundLiterals, "$1");
        transformedQuery = transformedQuery.replace(restoreLiteralsRegex, (match, index) => literals[parseInt(index, 10)]);
        transformedQuery = transformedQuery.trim();
        if (this.isCaching) {
            this.cache.set(query, transformedQuery);
        }
        ;
        return transformedQuery;
    }
}
exports.default = MySQLMinifier;
class LRUCache {
    constructor(limit = 100) {
        this.size = 0;
        this.head = null;
        this.tail = null;
        this.limit = limit;
        this.cache = {};
    }
    moveToHead(node) {
        if (this.head === node) {
            return;
        }
        if (node.prev !== null) {
            node.prev.next = node.next;
        }
        if (node.next !== null) {
            node.next.prev = node.prev;
        }
        if (this.tail === node) {
            this.tail = node.prev;
        }
        node.next = this.head;
        node.prev = null;
        if (this.head !== null) {
            this.head.prev = node;
        }
        this.head = node;
        if (this.tail === null) {
            this.tail = node;
        }
    }
    removeTail() {
        if (this.tail === null) {
            return;
        }
        const tailNode = this.tail;
        delete this.cache[tailNode.key];
        if (tailNode.prev !== null) {
            this.tail = tailNode.prev;
            this.tail.next = null;
        }
        else {
            this.head = null;
            this.tail = null;
        }
        this.size--;
    }
    get(key) {
        const node = this.cache[key];
        if (node === undefined) {
            return undefined;
        }
        this.moveToHead(node);
        return node.value;
    }
    set(key, value) {
        let node = this.cache[key];
        if (node !== undefined) {
            node.value = value;
            this.moveToHead(node);
        }
        else {
            node = {
                key: key,
                value: value,
                prev: null,
                next: null,
            };
            this.cache[key] = node;
            this.moveToHead(node);
            this.size++;
            if (this.size > this.limit) {
                this.removeTail();
            }
        }
    }
    clear() {
        this.cache = {};
        this.head = null;
        this.tail = null;
        this.size = 0;
    }
}
//# sourceMappingURL=index.js.map