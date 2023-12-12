export default class MySQLMinifier {
    private cache;
    private isCaching;
    constructor(isCaching?: boolean);
    minify(query: string): string;
}
