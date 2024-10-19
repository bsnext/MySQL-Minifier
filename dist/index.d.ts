export default class MySQLMinifier {
    private cache?;
    private isCaching;
    private cacheSize;
    private cacheLimit;
    constructor(isCaching?: boolean, cacheLimit?: number, cachePurgeTime?: number);
    minify(query: string): string;
}
