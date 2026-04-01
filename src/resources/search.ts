import type { FirmApi } from '../client';
import type { AutocompleteResponse, ApiResponse, CompanyData } from '../types';

export interface SearchOptions {
  limit?: number;
  offset?: number;
}

export interface NameSearchOptions extends SearchOptions {
  exact?: boolean;
}

export interface AdvancedSearchParams extends SearchOptions {
  name?: string;
  city?: string;
  legal_form?: string;
  [key: string]: string | number | boolean | undefined;
}

export class Search {
  constructor(private readonly client: FirmApi) {}

  /**
   * Autocomplete search for companies.
   * Returns Select2-compatible format.
   *
   * @param query - Search query (min 2 characters)
   * @param limit - Maximum results (default: 10, max: 20)
   */
  async autocomplete(query: string, limit: number = 10): Promise<AutocompleteResponse> {
    return this.client.get<AutocompleteResponse>('/search/autocomplete', {
      q: query,
      limit: Math.min(limit, 20),
    });
  }

  /**
   * Search companies by name.
   *
   * @param name - Company name
   * @param options - Search options (exact, limit, offset)
   */
  async byName(
    name: string,
    options: NameSearchOptions = {}
  ): Promise<ApiResponse<CompanyData[]>> {
    const { exact = false, limit = 10, offset = 0 } = options;

    return this.client.get<ApiResponse<CompanyData[]>>('/search/name', {
      q: name,
      exact: exact ? 1 : 0,
      limit,
      offset,
    });
  }

  /**
   * Search companies by partial IČO.
   *
   * @param ico - Partial IČO
   * @param options - Search options (limit, offset)
   */
  async byIco(
    ico: string,
    options: SearchOptions = {}
  ): Promise<ApiResponse<CompanyData[]>> {
    const { limit = 10, offset = 0 } = options;

    return this.client.get<ApiResponse<CompanyData[]>>('/search/ico', {
      q: ico,
      limit,
      offset,
    });
  }

  /**
   * Advanced multi-field search.
   *
   * @param params - Search parameters (name, city, legal_form, etc.)
   */
  async advanced(params: AdvancedSearchParams): Promise<ApiResponse<CompanyData[]>> {
    const queryParams: Record<string, string | number | boolean> = {};

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams[key] = value;
      }
    });

    return this.client.get<ApiResponse<CompanyData[]>>('/search/advanced', queryParams);
  }
}
