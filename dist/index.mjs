// src/resources/companies.ts
var CompanyQuery = class {
  constructor(client, path, waitForFreshData, maxStaleRetries) {
    this.client = client;
    this.path = path;
    this.waitForFreshData = waitForFreshData;
    this.maxStaleRetries = maxStaleRetries;
  }
  scopes = [];
  withTax() {
    this.scopes.push("tax");
    return this;
  }
  withBankAccounts() {
    this.scopes.push("bank_accounts");
    return this;
  }
  withContacts() {
    this.scopes.push("contacts");
    return this;
  }
  withFinancials() {
    this.scopes.push("financials");
    return this;
  }
  withDebtorStatus() {
    this.scopes.push("debtor_status");
    return this;
  }
  withFinancialStatements() {
    this.scopes.push("financial_statements");
    return this;
  }
  withInsolvency() {
    this.scopes.push("insolvency");
    return this;
  }
  withCommercialBulletin() {
    this.scopes.push("commercial_bulletin");
    return this;
  }
  withPublicContracts() {
    this.scopes.push("public_contracts");
    return this;
  }
  withProcurement() {
    this.scopes.push("procurement");
    return this;
  }
  withAll() {
    this.scopes = ["all"];
    return this;
  }
  /**
   * Execute the query and return the company data.
   */
  async get() {
    let fullPath = this.path;
    if (this.scopes.length > 0) {
      const unique = [...new Set(this.scopes)];
      fullPath += `?scope=${unique.join(",")}`;
    }
    const response = await this.client.get(fullPath);
    return this.resolveStaleResponse(response, fullPath);
  }
  /**
   * Makes CompanyQuery thenable – allows `await client.company.byIco('...')` directly.
   */
  then(onfulfilled, onrejected) {
    return this.get().then(onfulfilled, onrejected);
  }
  async resolveStaleResponse(response, path) {
    if (!this.waitForFreshData || !response.meta?.stale) {
      return response;
    }
    let current = response;
    for (let attempt = 0; attempt < this.maxStaleRetries; attempt++) {
      const waitMs = this.calculateWaitMs(current.meta?.retry_at ?? null);
      if (waitMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      }
      current = await this.client.get(path);
      if (!current.meta?.stale) {
        return current;
      }
    }
    return current;
  }
  calculateWaitMs(retryAt) {
    if (!retryAt) {
      return 5e3;
    }
    const retryTime = new Date(retryAt).getTime();
    if (isNaN(retryTime)) {
      return 5e3;
    }
    const waitMs = retryTime - Date.now();
    return Math.max(1e3, Math.min(waitMs, 6e4));
  }
};
var Companies = class {
  constructor(client) {
    this.client = client;
  }
  /**
   * Look up a company by IČO (registration number).
   *
   * Can be awaited directly for base data, or chained with enrichment methods:
   *   await client.company.byIco('51636549');                         // base data
   *   await client.company.byIco('51636549').withTax();               // with tax
   *   await client.company.byIco('51636549').withAll();               // everything
   */
  byIco(ico) {
    return new CompanyQuery(
      this.client,
      `/company/ico/${ico}`,
      this.client.waitForFreshData,
      this.client.maxStaleRetries
    );
  }
  /**
   * Look up a company by ORSR ID.
   */
  byOrsrId(orsrId) {
    return new CompanyQuery(
      this.client,
      `/company/id/${orsrId}`,
      this.client.waitForFreshData,
      this.client.maxStaleRetries
    );
  }
  /**
   * Look up a company by internal database ID.
   */
  byId(id) {
    return new CompanyQuery(
      this.client,
      `/company/${id}`,
      this.client.waitForFreshData,
      this.client.maxStaleRetries
    );
  }
};

// src/resources/search.ts
var Search = class {
  constructor(client) {
    this.client = client;
  }
  /**
   * Autocomplete search for companies.
   * Returns Select2-compatible format.
   *
   * @param query - Search query (min 2 characters)
   * @param limit - Maximum results (default: 10, max: 20)
   */
  async autocomplete(query, limit = 10) {
    return this.client.get("/search/autocomplete", {
      q: query,
      limit: Math.min(limit, 20)
    });
  }
  /**
   * Search companies by name.
   *
   * @param name - Company name
   * @param options - Search options (exact, limit, offset)
   */
  async byName(name, options = {}) {
    const { exact = false, limit = 10, offset = 0 } = options;
    return this.client.get("/search/name", {
      q: name,
      exact: exact ? 1 : 0,
      limit,
      offset
    });
  }
  /**
   * Search companies by partial IČO.
   *
   * @param ico - Partial IČO
   * @param options - Search options (limit, offset)
   */
  async byIco(ico, options = {}) {
    const { limit = 10, offset = 0 } = options;
    return this.client.get("/search/ico", {
      q: ico,
      limit,
      offset
    });
  }
  /**
   * Advanced multi-field search.
   *
   * @param params - Search parameters (name, city, legal_form, etc.)
   */
  async advanced(params) {
    const queryParams = {};
    Object.entries(params).forEach(([key, value]) => {
      if (value !== void 0) {
        queryParams[key] = value;
      }
    });
    return this.client.get("/search/advanced", queryParams);
  }
};

// src/resources/batch.ts
var Batch = class {
  constructor(client) {
    this.client = client;
  }
  /**
   * Batch lookup companies by IČO.
   * Requires Starter plan or higher.
   *
   * @param icos - Array of 8-digit IČO numbers
   */
  async byIco(icos) {
    return this.client.post("/batch/ico", { icos });
  }
  /**
   * Batch lookup companies by name.
   * Requires Starter plan or higher.
   *
   * @param names - Array of company names
   */
  async byNames(names) {
    return this.client.post("/batch/names", { names });
  }
  /**
   * Get batch job status.
   *
   * @param batchId - Batch job ID
   */
  async status(batchId) {
    return this.client.get(`/batch/${batchId}/status`);
  }
  /**
   * Get batch job results.
   *
   * @param batchId - Batch job ID
   */
  async results(batchId) {
    return this.client.get(`/batch/${batchId}/results`);
  }
};

// src/resources/account.ts
var Account = class {
  constructor(client) {
    this.client = client;
  }
  /**
   * Get current period usage statistics.
   */
  async usage() {
    return this.client.get("/account/usage");
  }
  /**
   * Get remaining quota for current period.
   */
  async quota() {
    return this.client.get("/account/quota");
  }
  /**
   * Get usage history.
   *
   * @param days - Number of days to retrieve (default: 30)
   */
  async history(days = 30) {
    return this.client.get("/account/history", { days });
  }
};

// src/exceptions.ts
var ApiException = class _ApiException extends Error {
  statusCode;
  constructor(message, statusCode = 0) {
    super(message);
    this.name = "ApiException";
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, _ApiException.prototype);
  }
};
var AuthenticationException = class _AuthenticationException extends ApiException {
  constructor(message = "Authentication failed") {
    super(message, 401);
    this.name = "AuthenticationException";
    Object.setPrototypeOf(this, _AuthenticationException.prototype);
  }
};
var RateLimitException = class _RateLimitException extends ApiException {
  retryAfter;
  constructor(message = "Rate limit exceeded", retryAfter = 60) {
    super(message, 429);
    this.name = "RateLimitException";
    this.retryAfter = retryAfter;
    Object.setPrototypeOf(this, _RateLimitException.prototype);
  }
};
var ValidationException = class _ValidationException extends ApiException {
  errors;
  constructor(message = "Validation failed", errors = {}) {
    super(message, 422);
    this.name = "ValidationException";
    this.errors = errors;
    Object.setPrototypeOf(this, _ValidationException.prototype);
  }
  getFieldErrors(field) {
    return this.errors[field] ?? [];
  }
};

// src/client.ts
var DEFAULT_BASE_URL = "https://api.firmapi.sk/v1";
var DEFAULT_TIMEOUT = 3e4;
var FirmApi = class {
  apiKey;
  baseUrl;
  timeout;
  waitForFreshData;
  maxStaleRetries;
  companies;
  search;
  batch;
  account;
  constructor(apiKeyOrConfig) {
    if (typeof apiKeyOrConfig === "string") {
      this.apiKey = apiKeyOrConfig;
      this.baseUrl = DEFAULT_BASE_URL;
      this.timeout = DEFAULT_TIMEOUT;
      this.waitForFreshData = true;
      this.maxStaleRetries = 3;
    } else {
      this.apiKey = apiKeyOrConfig.apiKey;
      this.baseUrl = apiKeyOrConfig.baseUrl?.replace(/\/$/, "") ?? DEFAULT_BASE_URL;
      this.timeout = apiKeyOrConfig.timeout ?? DEFAULT_TIMEOUT;
      this.waitForFreshData = apiKeyOrConfig.waitForFreshData ?? true;
      this.maxStaleRetries = apiKeyOrConfig.maxStaleRetries ?? 3;
    }
    this.companies = new Companies(this);
    this.search = new Search(this);
    this.batch = new Batch(this);
    this.account = new Account(this);
  }
  /**
   * Make a GET request to the API.
   */
  async get(endpoint, query) {
    let url = this.baseUrl + endpoint;
    if (query) {
      const params = new URLSearchParams();
      Object.entries(query).forEach(([key, value]) => {
        if (value !== void 0 && value !== null) {
          params.append(key, String(value));
        }
      });
      const qs = params.toString();
      if (qs) {
        url += "?" + qs;
      }
    }
    return this.request("GET", url);
  }
  /**
   * Make a POST request to the API.
   */
  async post(endpoint, data) {
    return this.request("POST", this.baseUrl + endpoint, data);
  }
  /**
   * Make a request to the API.
   */
  async request(method, url, body) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    try {
      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: body ? JSON.stringify(body) : void 0,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        await this.handleErrorResponse(response);
      }
      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof ApiException) {
        throw error;
      }
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw new ApiException("Request timeout", 408);
        }
        throw new ApiException(`Network error: ${error.message}`, 0);
      }
      throw new ApiException("Unknown error occurred", 0);
    }
  }
  /**
   * Handle error responses from the API.
   */
  async handleErrorResponse(response) {
    let body;
    try {
      body = await response.json();
    } catch {
      body = {};
    }
    const message = body.message ?? body.error ?? response.statusText;
    switch (response.status) {
      case 401:
        throw new AuthenticationException(message);
      case 422:
        throw new ValidationException(message, body.errors ?? {});
      case 429: {
        const retryAfter = parseInt(response.headers.get("Retry-After") ?? "60", 10);
        throw new RateLimitException(message, retryAfter);
      }
      default:
        throw new ApiException(message, response.status);
    }
  }
  /**
   * Get the API key.
   */
  getApiKey() {
    return this.apiKey;
  }
  /**
   * Get the base URL.
   */
  getBaseUrl() {
    return this.baseUrl;
  }
};
export {
  Account,
  ApiException,
  AuthenticationException,
  Batch,
  Companies,
  FirmApi,
  RateLimitException,
  Search,
  ValidationException,
  FirmApi as default
};
