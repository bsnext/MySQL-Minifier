"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commentRegex = new RegExp(/(--[^\n]*|#.*|\/\*[\s\S]*?\*\/)/gm);
const literalsRegex = new RegExp(/(".*?(?<!\\)"|'.*?(?<!\\)'|`.*?`)/gs);
const whitespaceRegex = new RegExp(/\s*(\,|\`|\'|\"|\+|\-|\=|\:|\=|\*|\;|\@|\<\=?|\>\=?|\(|\)|`AS|`AND|`ORDER|`WHERE|`FROM|AS`|AND`|ORDER`|WHERE`|FROM`)\s*/g);
const parenKeywordsRegex = new RegExp(/\)\s+(AS|AND|ORDER|WHERE|FROM)\s+\(/g);
const restoreLiteralsRegex = new RegExp(/\!\$LIT(\d+)\!\$/g);
const removeWhitespaceAroundLiterals = new RegExp(/\s*(!\$LIT\d{1,5}!\$)\s*/g);
class MySQLMinifier {
    constructor(isCaching = false, cacheLimit = 100, cachePurgeTime = 60000 * 5) {
        this.isCaching = isCaching;
        this.cacheLimit = cacheLimit;
        this.cacheSize = 0;
        this.cache = {};
        if (isCaching) {
            setInterval(this.purge.bind(this), cachePurgeTime);
        }
    }
    minify(query) {
        const cachedQuery = this.cache[query];
        if (this.isCaching && cachedQuery) {
            return cachedQuery;
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
            if (this.cacheSize >= this.cacheLimit) {
                this.cacheSize = 1;
            }
            else {
                this.cacheSize = this.cacheSize + 1;
            }
            this.cache[query] = transformedQuery;
        }
        ;
        return transformedQuery;
    }
    purge() {
        if (!this.isCaching) {
            throw new Error("MySQL-Minifier caching is not enabled, .purge() method not available.");
        }
        this.cacheSize = 0;
        this.cache = {};
    }
}
exports.default = MySQLMinifier;
//# sourceMappingURL=index.js.map