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

  public readonly companies: Companies;
  public readonly search: Search;
  public readonly batch: Batch;
  public readonly account: Account;

  constructor(apiKeyOrConfig: string | FirmApiConfig) {
    if (typeof apiKeyOrConfig === 'string') {
      this.apiKey = apiKeyOrConfig;
      this.baseUrl = DEFAULT_BASE_URL;
      this.timeout = DEFAULT_TIMEOUT;
      this.waitForFreshData = true;
      this.maxStaleRetries = 3;
    } else {
      this.apiKey = apiKeyOrConfig.apiKey;
      this.baseUrl = apiKeyOrConfig.baseUrl?.replace(/\/$/, '') ?? DEFAULT_BASE_URL;
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
   * Make a request to the API.
   */
  private async request<T>(method: string, url: string, body?: unknown): Promise<T> {
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
        await this.handleErrorResponse(response);
      }

      return (await response.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof ApiException) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new ApiException('Request timeout', 408);
        }
        throw new ApiException(`Network error: ${error.message}`, 0);
      }

      throw new ApiException('Unknown error occurred', 0);
    }
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
