interface FirmApiConfig {
    apiKey: string;
    baseUrl?: string;
    timeout?: number;
    /** Auto-retry when response has stale data (default: true) */
    waitForFreshData?: boolean;
    /** Max retries for stale data (default: 3) */
    maxStaleRetries?: number;
}
interface ApiResponse<T = unknown> {
    data: T;
    meta?: {
        synced_at?: string;
        source?: string;
        stale?: boolean;
        retry_at?: string | null;
        stale_reason?: string | null;
        enriched_at?: string | null;
        [key: string]: unknown;
    };
}
interface Shareholder {
    name: string;
    share_amount?: string;
    share_percentage?: string;
    address?: string;
}
interface StatutoryBody {
    name: string;
    role: string;
    address?: string;
    since?: string;
}
interface TaxInfo {
    dic?: string;
    ic_dph?: string;
    vies_valid?: boolean;
    vies_verified_at?: string;
}
interface BankAccount {
    iban: string;
    bank?: string;
    published?: boolean;
}
interface Contacts {
    email?: string;
    phone?: string;
    website?: string;
}
interface Financials {
    latest_year?: number;
    revenue?: number;
    profit?: number;
    employees?: number;
}
interface CompanyData {
    id: number;
    orsr_id: string;
    ico: string;
    name: string;
    address: string;
    registration_date?: string;
    legal_form?: string;
    business_activities?: string;
    registered_capital?: string;
    shareholders?: Shareholder[];
    statutory_body?: StatutoryBody[];
    tax?: TaxInfo;
    bank_accounts?: BankAccount[];
    contacts?: Contacts;
    financials?: Financials;
}
interface Company extends ApiResponse<CompanyData> {
}
interface SearchResult {
    id: string;
    text: string;
    ico: string;
    city?: string;
}
interface AutocompleteResponse {
    results: SearchResult[];
    pagination: {
        more: boolean;
    };
}
interface BatchResult {
    found: boolean;
    data: CompanyData | null;
}
interface BatchResponse extends ApiResponse<Record<string, BatchResult>> {
    meta: {
        total: number;
        found: number;
        not_found: number;
    };
}
interface UsageData {
    requests_today: number;
    requests_month: number;
    limit_daily: number;
    limit_monthly: number;
}
interface UsageResponse extends ApiResponse<UsageData> {
}
interface QuotaData {
    remaining_daily: number;
    remaining_monthly: number;
    reset_daily: string;
    reset_monthly: string;
}
interface QuotaResponse extends ApiResponse<QuotaData> {
}
interface HistoryEntry {
    date: string;
    requests: number;
}
interface HistoryResponse extends ApiResponse<HistoryEntry[]> {
}

declare class CompanyQuery implements PromiseLike<Company> {
    private readonly client;
    private readonly path;
    private readonly waitForFreshData;
    private readonly maxStaleRetries;
    private scopes;
    constructor(client: FirmApi, path: string, waitForFreshData: boolean, maxStaleRetries: number);
    withTax(): this;
    withBankAccounts(): this;
    withContacts(): this;
    withFinancials(): this;
    withDebtorStatus(): this;
    withFinancialStatements(): this;
    withInsolvency(): this;
    withCommercialBulletin(): this;
    withPublicContracts(): this;
    withProcurement(): this;
    withAll(): this;
    /**
     * Execute the query and return the company data.
     */
    get(): Promise<Company>;
    /**
     * Makes CompanyQuery thenable – allows `await client.company.byIco('...')` directly.
     */
    then<TResult1 = Company, TResult2 = never>(onfulfilled?: ((value: Company) => TResult1 | PromiseLike<TResult1>) | null, onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null): Promise<TResult1 | TResult2>;
    private resolveStaleResponse;
    private calculateWaitMs;
}
declare class Companies {
    private readonly client;
    constructor(client: FirmApi);
    /**
     * Look up a company by IČO (registration number).
     *
     * Can be awaited directly for base data, or chained with enrichment methods:
     *   await client.company.byIco('51636549');                         // base data
     *   await client.company.byIco('51636549').withTax();               // with tax
     *   await client.company.byIco('51636549').withAll();               // everything
     */
    byIco(ico: string): CompanyQuery;
    /**
     * Look up a company by ORSR ID.
     */
    byOrsrId(orsrId: string): CompanyQuery;
    /**
     * Look up a company by internal database ID.
     */
    byId(id: number): CompanyQuery;
}

interface SearchOptions {
    limit?: number;
    offset?: number;
}
interface NameSearchOptions extends SearchOptions {
    exact?: boolean;
}
interface AdvancedSearchParams extends SearchOptions {
    name?: string;
    city?: string;
    legal_form?: string;
    [key: string]: string | number | boolean | undefined;
}
declare class Search {
    private readonly client;
    constructor(client: FirmApi);
    /**
     * Autocomplete search for companies.
     * Returns Select2-compatible format.
     *
     * @param query - Search query (min 2 characters)
     * @param limit - Maximum results (default: 10, max: 20)
     */
    autocomplete(query: string, limit?: number): Promise<AutocompleteResponse>;
    /**
     * Search companies by name.
     *
     * @param name - Company name
     * @param options - Search options (exact, limit, offset)
     */
    byName(name: string, options?: NameSearchOptions): Promise<ApiResponse<CompanyData[]>>;
    /**
     * Search companies by partial IČO.
     *
     * @param ico - Partial IČO
     * @param options - Search options (limit, offset)
     */
    byIco(ico: string, options?: SearchOptions): Promise<ApiResponse<CompanyData[]>>;
    /**
     * Advanced multi-field search.
     *
     * @param params - Search parameters (name, city, legal_form, etc.)
     */
    advanced(params: AdvancedSearchParams): Promise<ApiResponse<CompanyData[]>>;
}

interface BatchStatus {
    id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    total: number;
    processed: number;
    created_at: string;
    completed_at?: string;
}
declare class Batch {
    private readonly client;
    constructor(client: FirmApi);
    /**
     * Batch lookup companies by IČO.
     * Requires Starter plan or higher.
     *
     * @param icos - Array of 8-digit IČO numbers
     */
    byIco(icos: string[]): Promise<BatchResponse>;
    /**
     * Batch lookup companies by name.
     * Requires Starter plan or higher.
     *
     * @param names - Array of company names
     */
    byNames(names: string[]): Promise<BatchResponse>;
    /**
     * Get batch job status.
     *
     * @param batchId - Batch job ID
     */
    status(batchId: string): Promise<ApiResponse<BatchStatus>>;
    /**
     * Get batch job results.
     *
     * @param batchId - Batch job ID
     */
    results(batchId: string): Promise<BatchResponse>;
}

declare class Account {
    private readonly client;
    constructor(client: FirmApi);
    /**
     * Get current period usage statistics.
     */
    usage(): Promise<UsageResponse>;
    /**
     * Get remaining quota for current period.
     */
    quota(): Promise<QuotaResponse>;
    /**
     * Get usage history.
     *
     * @param days - Number of days to retrieve (default: 30)
     */
    history(days?: number): Promise<HistoryResponse>;
}

declare class FirmApi {
    private readonly apiKey;
    private readonly baseUrl;
    private readonly timeout;
    readonly waitForFreshData: boolean;
    readonly maxStaleRetries: number;
    readonly companies: Companies;
    readonly search: Search;
    readonly batch: Batch;
    readonly account: Account;
    constructor(apiKeyOrConfig: string | FirmApiConfig);
    /**
     * Make a GET request to the API.
     */
    get<T = unknown>(endpoint: string, query?: Record<string, string | number | boolean>): Promise<T>;
    /**
     * Make a POST request to the API.
     */
    post<T = unknown>(endpoint: string, data?: unknown): Promise<T>;
    /**
     * Make a request to the API.
     */
    private request;
    /**
     * Handle error responses from the API.
     */
    private handleErrorResponse;
    /**
     * Get the API key.
     */
    getApiKey(): string;
    /**
     * Get the base URL.
     */
    getBaseUrl(): string;
}

declare class ApiException extends Error {
    readonly statusCode: number;
    constructor(message: string, statusCode?: number);
}
declare class AuthenticationException extends ApiException {
    constructor(message?: string);
}
declare class RateLimitException extends ApiException {
    readonly retryAfter: number;
    constructor(message?: string, retryAfter?: number);
}
declare class ValidationException extends ApiException {
    readonly errors: Record<string, string[]>;
    constructor(message?: string, errors?: Record<string, string[]>);
    getFieldErrors(field: string): string[];
}

export { Account, ApiException, type ApiResponse, AuthenticationException, type AutocompleteResponse, Batch, type BatchResponse, Companies, type Company, type CompanyData, FirmApi, type FirmApiConfig, type QuotaResponse, RateLimitException, Search, type SearchResult, type UsageResponse, ValidationException, FirmApi as default };
