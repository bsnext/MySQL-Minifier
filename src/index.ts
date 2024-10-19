// Define regular expressions outside of the function
const commentRegex = new RegExp(/(--[^\n]*|#.*|\/\*[\s\S]*?\*\/)/gm);
const literalsRegex = new RegExp(/(".*?(?<!\\)"|'.*?(?<!\\)'|`.*?`)/gs);
const whitespaceRegex = new RegExp(/\s*(\,|\`|\'|\"|\+|\-|\=|\:|\=|\*|\;|\@|\<\=?|\>\=?|\(|\)|`AS|`AND|`ORDER|`WHERE|`FROM|AS`|AND`|ORDER`|WHERE`|FROM`)\s*/g);
const parenKeywordsRegex = new RegExp(/\)\s+(AS|AND|ORDER|WHERE|FROM)\s+\(/g);

const restoreLiteralsRegex = new RegExp(/\!\$LIT(\d+)\!\$/g);
const removeWhitespaceAroundLiterals = new RegExp(/\s*(!\$LIT\d{1,5}!\$)\s*/g);

////////////////////////////////

// Define a class
export default class MySQLMinifier {
    private cache?: LRUCache;
    private isCaching: boolean;
    private cacheSize: number;
    private cacheLimit: number;

    constructor(isCaching: boolean = false, cacheLimit: number = 100, cachePurgeTime?: number) {
        this.isCaching = isCaching;
        this.cacheLimit = cacheLimit;

        if (this.isCaching) {
            this.cache = new LRUCache(cacheLimit);

            if ((typeof cachePurgeTime === `number`) && (cachePurgeTime > 1)) {
                setInterval(this.cache.clear.bind(this.cache), cachePurgeTime * 1000);
            }
        }
    }

    minify(query: string): string {
        // Check if the query is already in the cache
        if (this.isCaching) {            
            const cachedQuery = this.cache!.get<string>(query);

            if (cachedQuery) {
                return cachedQuery;
            }
        }

        // Extract and store string literals
        const literals: string[] = [];

        let transformedQuery = query.replace(literalsRegex, match => {
            literals.push(match);
            return `!$LIT${literals.length - 1}!$`;
        });

        // Remove comments
        transformedQuery = transformedQuery.replace(commentRegex, '');

        // Remove new lines and redundant spaces, except in string literals
        transformedQuery = transformedQuery.replace(literalsRegex, match => `<${match}>`);
        transformedQuery = transformedQuery.replace(/\s+/g, ' ');
        transformedQuery = transformedQuery.replace(/<('.*?'|".*?"|`.*?`|\?.*?|:\w+)>/g, match => match.slice(1, -1));

        // Replace unnecessary whitespaces around operators and keywords
        transformedQuery = transformedQuery.replace(whitespaceRegex, '$1');

        // Additional step to handle spaces between parentheses and keywords
        transformedQuery = transformedQuery.replace(parenKeywordsRegex, ')$1(');

        // Restore string literals
        transformedQuery = transformedQuery.replace(removeWhitespaceAroundLiterals, "$1");
        transformedQuery = transformedQuery.replace(restoreLiteralsRegex, (match, index) => literals[parseInt(index, 10)]);

        // Trim the transformed query
        transformedQuery = transformedQuery.trim();

        // Cache the transformed query
        if (this.isCaching) {
            this.cache!.set(query, transformedQuery);
        };

        return transformedQuery;
    }
}

////////////////////////////////

interface LRUCacheNode {
    key: string;
    value: any;
    prev: LRUCacheNode | null;
    next: LRUCacheNode | null;
}

class LRUCache {
    private limit: number;
    private cache: Record<string, LRUCacheNode | undefined>;
    private size: number = 0;
    private head: LRUCacheNode | null = null;
    private tail: LRUCacheNode | null = null;

    constructor(limit: number = 100) {
        this.limit = limit;
        this.cache = {};
    }

    private moveToHead(node: LRUCacheNode): void {
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

    private removeTail(): void {
        if (this.tail === null) {
            return;
        }

        const tailNode = this.tail;
        delete this.cache[tailNode.key];

        if (tailNode.prev !== null) {
            this.tail = tailNode.prev;
            this.tail.next = null;
        } else {
            this.head = null;
            this.tail = null;
        }

        this.size--;
    }

    get<T>(key: string): T | undefined {
        const node = this.cache[key];

        if (node === undefined) {
            return undefined;
        }

        this.moveToHead(node);

        return node.value as T;
    }

    set(key: string, value: any): void {
        let node = this.cache[key];

        if (node !== undefined) {
            node.value = value;
            this.moveToHead(node);
        } else {
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

    clear(): void {
        this.cache = {};
        this.head = null;
        this.tail = null;
        this.size = 0;
    }
}