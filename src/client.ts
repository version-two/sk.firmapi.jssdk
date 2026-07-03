import { Companies } from './resources/companies';
import { Search } from './resources/search';
import { Batch } from './resources/batch';
import { Account } from './resources/account';
import {
  ApiException,
  AuthenticationException,
  RateLimitException,
  ValidationException,
} from './exceptions';
import type { FirmApiConfig } from './types';

const DEFAULT_BASE_URL = 'https://api.firmapi.sk/v1';
const SANDBOX_BASE_URL = 'https://api.firmapi.sk/v1/sandbox';
const SANDBOX_API_KEY = 'fa_sandbox_test_key_firmapi_sk_2026';
const DEFAULT_TIMEOUT = 30000;

export class FirmApi {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeout: number;
  public readonly waitForFreshData: boolean;
  public readonly maxStaleRetries: number;
  public readonly maxRetries: number;

  public readonly companies: Companies;
  public readonly search: Search;
  public readonly batch: Batch;
  public readonly account: Account;

  constructor(apiKeyOrConfig: string | FirmApiConfig) {
    if (typeof apiKeyOrConfig === 'string') {
      this.apiKey = apiKeyOrConfig;
      this.baseUrl = DEFAULT_BASE_URL;
      this.timeout = DEFAULT_TIMEOUT;
      this.waitForFreshData = false;
      this.maxStaleRetries = 3;
      this.maxRetries = 2;
    } else {
      this.apiKey = apiKeyOrConfig.apiKey;
      this.baseUrl = apiKeyOrConfig.baseUrl?.replace(/\/$/, '') ?? DEFAULT_BASE_URL;
      this.timeout = apiKeyOrConfig.timeout ?? DEFAULT_TIMEOUT;
      this.waitForFreshData = apiKeyOrConfig.waitForFreshData ?? false;
      this.maxStaleRetries = apiKeyOrConfig.maxStaleRetries ?? 3;
      this.maxRetries = apiKeyOrConfig.maxRetries ?? 2;
    }

    this.companies = new Companies(this);
    this.search = new Search(this);
    this.batch = new Batch(this);
    this.account = new Account(this);
  }

  /**
   * Create a sandbox client for testing.
   * No API key needed, uses demo data, no rate limits.
   */
  static sandbox(): FirmApi {
    return new FirmApi({
      apiKey: SANDBOX_API_KEY,
      baseUrl: SANDBOX_BASE_URL,
    });
  }

  /**
   * Make a GET request to the API.
   */
  async get<T = unknown>(
    endpoint: string,
    query?: Record<string, string | number | boolean>
  ): Promise<T> {
    let url = this.baseUrl + endpoint;

    if (query) {
      const params = new URLSearchParams();
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
      const qs = params.toString();
      if (qs) {
        url += '?' + qs;
      }
    }

    return this.request<T>('GET', url);
  }

  /**
   * Make a POST request to the API.
   */
  async post<T = unknown>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>('POST', this.baseUrl + endpoint, data);
  }

  /**
   * Make a request to the API, retrying transient failures (HTTP 5xx and
   * network errors) with exponential backoff up to `maxRetries`. HTTP 429 is
   * never silently retried; it surfaces as a RateLimitException so the caller
   * controls pacing. Request timeouts are surfaced immediately (408).
   */
  private async request<T>(method: string, url: string, body?: unknown): Promise<T> {
    let attempt = 0;

    while (true) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      try {
        const response = await fetch(url, {
          method,
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          // Retry only server-side transient failures, never 4xx (incl. 429).
          if (response.status >= 500 && attempt < this.maxRetries) {
            attempt++;
            await this.backoff(attempt - 1);
            continue;
          }
          await this.handleErrorResponse(response);
        }

        return await this.parseJson<T>(response);
      } catch (error) {
        clearTimeout(timeoutId);

        if (error instanceof ApiException) {
          throw error;
        }

        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            throw new ApiException('Request timeout', 408);
          }
          // Network error (e.g. fetch TypeError): transient, safe to retry.
          if (attempt < this.maxRetries) {
            attempt++;
            await this.backoff(attempt - 1);
            continue;
          }
          throw new ApiException(`Network error: ${error.message}`, 0);
        }

        throw new ApiException('Unknown error occurred', 0);
      }
    }
  }

  /**
   * Parse a JSON response body, failing loudly on malformed payloads instead of
   * silently returning nothing (which would hide HTML error pages / truncated
   * responses).
   */
  private async parseJson<T>(response: Response): Promise<T> {
    const text = await response.text();
    if (text.trim() === '') {
      return {} as T;
    }
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new ApiException('Malformed JSON response from API', 0);
    }
  }

  /**
   * Exponential backoff (250ms, 500ms, 1s, ... capped at 5s) between
   * transient-failure retries.
   */
  private backoff(attempt: number): Promise<void> {
    const ms = Math.min(5000, 250 * 2 ** attempt);
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Handle error responses from the API.
   */
  private async handleErrorResponse(response: Response): Promise<never> {
    let body: { message?: string; error?: string; errors?: Record<string, string[]> };

    try {
      body = await response.json() as { message?: string; error?: string; errors?: Record<string, string[]> };
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
        const retryAfter = parseInt(response.headers.get('Retry-After') ?? '60', 10);
        throw new RateLimitException(message, retryAfter);
      }
      default:
        throw new ApiException(message, response.status);
    }
  }

  /**
   * Get the API key.
   */
  getApiKey(): string {
    return this.apiKey;
  }

  /**
   * Get the base URL.
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }
}
