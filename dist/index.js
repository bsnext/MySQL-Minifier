"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commentRegex = new RegExp(/(--[^\n]*|#.*|\/\*[\s\S]*?\*\/)/gm);
const literalsRegex = new RegExp(/(".*?(?<!\\)"|'.*?(?<!\\)'|`.*?`)/gs);
const whitespaceRegex = new RegExp(/\s*(\,|\`|\'|\"|\+|\-|\=|\:|\=|\*|\;|\@|\<\=?|\>\=?|\(|\)|`AS|`AND|`ORDER|`WHERE|`FROM|AS`|AND`|ORDER`|WHERE`|FROM`)\s*/g);
const parenKeywordsRegex = new RegExp(/\)\s+(AS|AND|ORDER|WHERE|FROM)\s+\(/g);
const restoreLiteralsRegex = new RegExp(/\!\$LIT(\d+)\!\$/g);
const removeWhitespaceAroundLiterals = new RegExp(/\s*(!\$LIT\d{1,5}!\$)\s*/g);
class MySQLMinifier {
    constructor(isCaching = false) {
        this.cache = new Map();
        this.isCaching = isCaching;
    }
    minify(query) {
        if (this.isCaching && this.cache.has(query)) {
            return this.cache.get(query);
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
//# sourceMappingURL=index.js.map