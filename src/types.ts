export interface FirmApiConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  /** Auto-retry when response has stale data (default: true) */
  waitForFreshData?: boolean;
  /** Max retries for stale data (default: 3) */
  maxStaleRetries?: number;
}

export interface ApiResponse<T = unknown> {
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

export interface Shareholder {
  name: string;
  share_amount?: string;
  share_percentage?: string;
  address?: string;
}

export interface StatutoryBody {
  name: string;
  role: string;
  address?: string;
  since?: string;
}

export interface TaxInfo {
  dic?: string;
  ic_dph?: string;
  vies_valid?: boolean;
  vies_verified_at?: string;
}

export interface BankAccount {
  iban: string;
  bank?: string;
  published?: boolean;
}

export interface Contacts {
  email?: string;
  phone?: string;
  website?: string;
}

export interface Financials {
  latest_year?: number;
  revenue?: number;
  profit?: number;
  employees?: number;
}

export interface ExecutionAuthorization {
  ecli: string;
  court_file_number?: string;
  court?: string;
  executor_name?: string;
  enforced_claim?: string;
  creditors?: unknown[];
  authorized_at?: string;
  published_at?: string;
}

export interface RpvsRegistration {
  business_name: string;
  person_type: string;
  valid_from?: string;
  beneficial_owners?: unknown[];
}

export interface TaxReliability {
  index?: string;
  is_reliable?: boolean | null;
}

export interface ErasedVatEntry {
  ic_dph: string;
  violation_year?: number;
  erased_at?: string;
}

export interface CompanyData {
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
  execution_authorizations?: {
    has_active_authorizations: boolean;
    total_count: number;
    authorizations: ExecutionAuthorization[];
  };
  rpvs?: {
    is_public_sector_partner: boolean;
    registrations: RpvsRegistration[];
  };
  nbs?: {
    is_regulated: boolean;
    license_types: string[];
  };
  tax_reliability?: TaxReliability;
  erased_vat?: {
    is_erased: boolean;
    entries: ErasedVatEntry[];
  };
}

export interface Company extends ApiResponse<CompanyData> {}

export interface SearchResult {
  id: string;
  text: string;
  ico: string;
  city?: string;
}

export interface AutocompleteResponse {
  results: SearchResult[];
  pagination: {
    more: boolean;
  };
}

export interface BatchResult {
  found: boolean;
  data: CompanyData | null;
}

export interface BatchResponse extends ApiResponse<Record<string, BatchResult>> {
  meta: {
    total: number;
    found: number;
    not_found: number;
  };
}

export interface UsageData {
  requests_today: number;
  requests_month: number;
  limit_daily: number;
  limit_monthly: number;
}

export interface UsageResponse extends ApiResponse<UsageData> {}

export interface QuotaData {
  remaining_daily: number;
  remaining_monthly: number;
  reset_daily: string;
  reset_monthly: string;
}

export interface QuotaResponse extends ApiResponse<QuotaData> {}

export interface HistoryEntry {
  date: string;
  requests: number;
}

export interface HistoryResponse extends ApiResponse<HistoryEntry[]> {}
