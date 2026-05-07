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

export interface RegesInfo {
  is_qualified_supplier: boolean;
  registration_id?: string | null;
  valid_from?: string | null;
  valid_to?: string | null;
}

export interface SocialEnterpriseInfo {
  is_registered: boolean;
  type?: string | null;
  granted_at?: string | null;
  certificate_number?: string | null;
  status?: string | null;
}

export interface GleifInfo {
  lei: string;
  parent_lei?: string | null;
  ultimate_parent_lei?: string | null;
  status?: string | null;
  registration_status?: string | null;
}

export interface SanctionsHit {
  [key: string]: unknown;
}

export interface SanctionsInfo {
  eu_fsf_hits: SanctionsHit[];
  ofac_hits: SanctionsHit[];
  total_hits: number;
}

export interface TedNoticeItem {
  publication_number: string;
  title?: string | null;
  publication_date?: string | null;
  value?: number | null;
  currency?: string | null;
}

export interface TedTendersInfo {
  count: number;
  latest: TedNoticeItem[];
  total_value: number;
}

export interface ReplikAdministratorInfo {
  license_number: string;
  region?: string | null;
  status?: string | null;
  valid_from?: string | null;
  valid_to?: string | null;
}

export interface SbsInfo {
  has_licence: boolean;
  license_number?: string | null;
  license_type?: string | null;
  valid_from?: string | null;
  valid_to?: string | null;
}

export interface TransportLicenceInfo {
  has_licence: boolean;
  eurolicence_number?: string | null;
  vehicles_count?: number | null;
  valid_from?: string | null;
  valid_to?: string | null;
}

export interface UtilitySegment {
  licence_number: string;
  segment: string;
  valid_from?: string | null;
  valid_to?: string | null;
}

export interface UtilityLicenceInfo {
  has_licences: boolean;
  segments: UtilitySegment[];
}

export interface ContractingAuthorityInfo {
  is_contracting_authority: boolean;
  classification_section?: string | null;
  classification_label?: string | null;
}

export interface DebarredInfo {
  is_debarred: boolean;
  is_listed: boolean;
  status?: string | null;
  violation_reason?: string | null;
  banned_from?: string | null;
  banned_until?: string | null;
}

export interface UvoReferenceItem {
  buyer_name: string;
  contract_subject: string;
  document_url?: string | null;
  rating?: string | null;
  published_at?: string | null;
  /** Hodnota zmluvy v EUR. */
  value?: number | null;
}

export interface UvoReferencesInfo {
  count: number;
  /** Súčet hodnoty zmlúv v EUR. */
  total_value: number;
  currency: string;
  latest: UvoReferenceItem[];
}

export interface FsDphnoEntry {
  period?: string | null;
  excess_eur?: number | null;
  own_tax_eur?: number | null;
}

export interface FsDphoEntry {
  ic_dph?: string | null;
  started_at?: string | null;
  ended_at?: string | null;
}

export interface FsDphzEntry {
  year?: number | null;
  published_at?: string | null;
}

export interface FsDpposEntry {
  period_from?: string | null;
  period_to?: string | null;
  tax_eur?: number | null;
  loss_eur?: number | null;
}

export interface FsDphOudEntry {
  oud_cislo?: string | null;
  oud_typ?: string | null;
  iban?: string | null;
  bank_code?: string | null;
}

export interface FsRdDeductionEntry {
  period?: string | null;
  amount_eur?: number | null;
  project?: string | null;
  started_at?: string | null;
}

export interface FsInvestmentDeductionEntry {
  period?: string | null;
  amount_eur?: number | null;
  investment_eur?: number | null;
  percent_planned?: number | null;
}

export interface FsPatentBoxEntry {
  subtype?: string | null;
  period?: string | null;
  exemption_eur?: number | null;
  patent_text?: string | null;
}

export interface FsRegulatedEntry {
  type?: string | null;
  from?: string | null;
  to?: string | null;
}

/** Daňové údaje z Finančnej správy SR. Dostupné pre plány s funkciou fs_imports. */
export interface FsData {
  dphno?: FsDphnoEntry[] | null;
  dpho?: FsDphoEntry[] | null;
  dphz?: FsDphzEntry[] | null;
  dppos?: FsDpposEntry[] | null;
  dsrdp_registered?: boolean | null;
  dph_oud?: FsDphOudEntry[] | null;
  rd_deduction?: FsRdDeductionEntry[] | null;
  investment_deduction?: FsInvestmentDeductionEntry[] | null;
  patent_box?: FsPatentBoxEntry[] | null;
  regulated?: FsRegulatedEntry[] | null;
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
  reges?: RegesInfo;
  social_enterprise?: SocialEnterpriseInfo;
  gleif?: GleifInfo | null;
  sanctions?: SanctionsInfo;
  ted_tenders?: TedTendersInfo;
  replik_administrator?: ReplikAdministratorInfo | null;
  sbs?: SbsInfo;
  transport_licence?: TransportLicenceInfo;
  utility_licence?: UtilityLicenceInfo;
  contracting_authority?: ContractingAuthorityInfo;
  debarred?: DebarredInfo;
  uvo_references?: UvoReferencesInfo;
  fs?: FsData;
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
