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
    private cache: { [key: string]: string; };
    private isCaching: boolean;
    private cacheSize: number;
    private cacheLimit: number;

    constructor(isCaching: boolean = false, cacheLimit: number = 100, cachePurgeTime: number = 60000 * 5) {
        this.isCaching = isCaching;
        this.cacheLimit = cacheLimit;
        this.cacheSize = 0;
        this.cache = {};

        if (isCaching) {
            setInterval(this.purge, cachePurgeTime);
        }
    }

    minify(query: string): string {
        // Check if the query is already in the cache
        const cachedQuery = this.cache[query];

        if (this.isCaching && cachedQuery) {
            return cachedQuery;
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
            if (this.cacheSize >= this.cacheLimit) {
                this.cacheSize = 1;
            } else {
                this.cacheSize = this.cacheSize + 1;
            }

            this.cache[query] = transformedQuery;
        };

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