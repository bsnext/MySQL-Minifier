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
    private cache: Map<string, string>;
    private isCaching: boolean;

    constructor(isCaching: boolean = false) {
        // Define a Map to cache the queries
        this.cache = new Map<string, string>();
        this.isCaching = isCaching;
    }

    minify(query: string): string {
        // Check if the query is already in the cache
        if (this.isCaching && this.cache.has(query)) {
            return this.cache.get(query)!;
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
            this.cache.set(query, transformedQuery);
        };

        return transformedQuery;
    }
}