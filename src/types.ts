export interface FirmApiConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  /**
   * Block and re-poll until the API reports non-stale data (default: false).
   * The API returns valid precomputed data immediately and only flags
   * `meta.stale` to signal a queued refresh, so waiting is off by default;
   * opt in per query with CompanyQuery.fresh() instead.
   */
  waitForFreshData?: boolean;
  /** Max re-polls when waiting for fresh data (default: 3) */
  maxStaleRetries?: number;
  /** Retries for transient 5xx/network errors with backoff (default: 2) */
  maxRetries?: number;
  /**
   * Force sandbox mode: target the public sandbox endpoint with the built-in
   * sandbox key (no real key needed, demo data, no rate limits). When omitted,
   * sandbox is auto-enabled from the FIRMAPI_SANDBOX env var in Node
   * (equivalent to FirmApi.sandbox()).
   */
  sandbox?: boolean;
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

export type NbsLicenceStatus = 'current' | 'ended';

/** One NBS authorisation: a category, or a sector inside it, optionally tied to a parent institution. */
export interface NbsLicence {
  category: string;
  sector: string | null;
  country: string | null;
  regfap_number: string | null;
  valid_from: string | null;
  parent: { entity_id: string | null; ico: string | null; name: string } | null;
  status: NbsLicenceStatus;
  first_seen_on: string;
  ended_on: string | null;
}

export interface NbsInfo {
  is_regulated: boolean;
  license_types: string[];
  categories: string[];
  entity_id: string | null;
  is_natural_person: boolean;
  licences: NbsLicence[];
  agents_count: number;
}

export interface NbsEntitySummary {
  entity_id: string;
  ico: string | null;
  name: string;
  address: string | null;
  country: string | null;
  is_natural_person: boolean;
  is_current: boolean;
  categories: string[];
  person_id: string | null;
  /** `name_postcode` is a probable match (same name and postcode, no verbatim address match). */
  person_match: 'address' | 'name_postcode' | null;
}

export interface NbsEntityDetail extends NbsEntitySummary {
  first_seen_on: string | null;
  delisted_on: string | null;
  nbs_updated_at: string | null;
  licences: NbsLicence[];
  agents_count: number;
}

export interface NbsAgent extends NbsEntitySummary {
  /** Only the licences tying this agent to the institution. */
  licences: NbsLicence[];
}

export interface NbsPageMeta {
  limit: number;
  offset: number;
  has_more: boolean;
}

export interface NbsEntityListResponse {
  data: NbsEntitySummary[];
  meta: NbsPageMeta;
}

export interface NbsAgentListResponse {
  data: NbsAgent[];
  meta: NbsPageMeta & { parent: NbsEntitySummary };
}

/** Function inside a collective body. */
export type PersonFunction = 'chairman' | 'vice_chairman' | 'member';

/** Equity holder – spoločník, akcionár / jediný akcionár, komanditista, komplementár. */
export interface Shareholder {
  name: string;
  address?: string | null;
  share_amount?: string | null;
  /** Paid-up part of the contribution. */
  share_paid?: string | null;
  /** ISO 4217 currency of share_amount / share_paid. */
  share_currency?: string | null;
  share_percentage?: string | null;
  /** Kind of contribution as registered (peňažný / nepeňažný). */
  contribution_kind?: string | null;
  /** Registered lien over the stake, if any. */
  deposit_lien?: string | null;
  /** Function inside a collective body (cooperatives, EEIG); null for plain stakes. */
  function?: PersonFunction | null;
  is_company?: boolean;
  ico?: string | null;
  /** Registry role as published by RPO/ORSR, e.g. "Spoločník v.o.s. / s.r.o.". */
  stakeholder_type?: string | null;
  effective_from?: string | null;
  /** Null while the stake is still registered. */
  effective_to?: string | null;
  /** True when the stake is registered as of today. */
  current?: boolean;
}

/**
 * A person or company registered in one of the company's bodies – supervisory
 * board, procurators, liquidators, administrators, founders, branch heads,
 * legal predecessors and other registered persons.
 */
export interface RegisteredPerson {
  name: string;
  address?: string | null;
  is_company?: boolean;
  ico?: string | null;
  /** Registry role as published by RPO/ORSR, e.g. "Člen dozorného orgánu". */
  stakeholder_type?: string | null;
  /** Function inside the body; null when the registry does not state one. */
  function?: PersonFunction | null;
  /** Only for procurators – the registered rule for how the procurator acts. */
  acting_method?: string | null;
  effective_from?: string | null;
  effective_to?: string | null;
  current?: boolean;
}

/** @deprecated since 2.3.0, use RegisteredPerson. */
export type OtherStakeholder = RegisteredPerson;

export interface StatutoryBody {
  name: string;
  /** Registry role label (konateľ, predseda predstavenstva, člen predstavenstva, ...). */
  role?: string | null;
  /** Function inside a collective statutory body; null for konateľ. */
  function?: PersonFunction | null;
  /** Type of the statutory body as registered (konatelia, predstavenstvo, ...). */
  body_type?: string | null;
  address?: string | null;
  /** Method of acting on behalf of the company; identical for every member of the body. */
  acting_method?: string | null;
  appointed_at?: string | null;
  effective_from?: string | null;
  /** Null while the person is still in office. */
  effective_to?: string | null;
  /** True when the person is in office as of today. */
  current?: boolean;
}

/** One share issue of a joint-stock company. */
export interface ShareIssue {
  share_type?: string | null;
  share_form?: string | null;
  share_state?: string | null;
  nominal_value?: string | null;
  currency?: string | null;
  count?: number | null;
  transferability?: string | null;
  effective_from?: string | null;
  effective_to?: string | null;
  current?: boolean;
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

export interface FinancialStatement {
  year: number;
  /** e.g. "riadna" (regular) | "mimoriadna" (extraordinary). */
  statement_type?: string | null;
  total_assets?: number | null;
  total_equity?: number | null;
  total_liabilities?: number | null;
  total_revenue?: number | null;
  net_profit?: number | null;
  template_type?: string | null;
  size_category?: string | null;
}

export interface FinancialStatementsInfo {
  /** Most recent regular ("riadna") statement, or null when none exist. */
  latest: FinancialStatement | null;
  /** Full multi-year series, newest year first. Drives revenue/profit/equity charts. */
  statements: FinancialStatement[];
  /** Distinct years with statements, ascending. */
  available_years: number[];
}

export interface DebtorSource {
  source?: string | null;
  debtor_name?: string | null;
  debt_amount?: number | null;
  listed_since?: string | null;
}

export interface DebtorStatus {
  is_debtor: boolean;
  sources: DebtorSource[];
}

export interface InsolvencyProceeding {
  case_number?: string | null;
  proceeding_type?: string | null;
  status?: string | null;
  court?: string | null;
  administrator?: string | null;
  started_at?: string | null;
}

export interface InsolvencyInfo {
  has_active_proceedings: boolean;
  proceedings: InsolvencyProceeding[];
}

export interface CommercialBulletinEntry {
  section?: string | null;
  heading?: string | null;
  published_at?: string | null;
}

export interface CommercialBulletinInfo {
  total_entries: number;
  latest_entries: CommercialBulletinEntry[];
}

export interface PublicContractsSummary {
  count: number;
  total_value: number | null;
}

export interface ProcurementSummary {
  count: number;
  total_awarded_value: number | null;
}

export interface IllegalEmploymentEntry {
  violation_date?: string | null;
  decision_date?: string | null;
  decision_number?: string | null;
  address?: string | null;
}

export interface IllegalEmploymentInfo {
  listed: boolean;
  count: number;
  since?: string | null;
  entries: IllegalEmploymentEntry[];
}

export interface CourtDecisionItem {
  decision_date?: string | null;
  court?: string | null;
  case_number?: string | null;
  role?: string | null;
  ruling?: string | null;
  decision_type?: string | null;
  pdf_url?: string | null;
}

export interface CourtDecisionsInfo {
  total: number;
  last_5_years: number;
  recent: CourtDecisionItem[];
}

export interface EmployerHeadcountInfo {
  name?: string | null;
  bracket?: string | null;
  registered_at?: string | null;
  deregistered_at?: string | null;
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

export interface CrpProjectItem {
  crp_id: string;
  name: string;
  provider?: string | null;
  help_type?: string | null;
  /** Výška pomoci v EUR. */
  amount?: number | null;
  published_at?: string | null;
  detail_url: string;
}

export interface CrpProjectsInfo {
  count: number;
  /** Súčet výšky pomoci v EUR. */
  total_value: number;
  currency: string;
  latest: CrpProjectItem[];
}

export interface Itms21ProjectItem {
  code: string;
  name: string;
  role: 'recipient' | 'partner' | 'supplier';
  status?: string | null;
  program?: string | null;
  call_code?: string | null;
  provider?: string | null;
  recipient?: string | null;
  recipient_ico?: string | null;
  place?: string | null;
  in_progress: boolean;
  completed: boolean;
  suspended: boolean;
  excluded_from_funding: boolean;
  terminated_without_contribution: boolean;
  /** EUR. */
  contracted_total?: number | null;
  contracted_nfp?: number | null;
  disbursed?: number | null;
  contract_effective_at?: string | null;
  started_at?: string | null;
  planned_end_at?: string | null;
  detail_url: string;
}

export interface Itms21ApplicationItem {
  code: string;
  name: string;
  role: 'applicant' | 'partner';
  status?: string | null;
  call_code?: string | null;
  call_name?: string | null;
  applicant?: string | null;
  applicant_ico?: string | null;
  approved: boolean;
  rejected: boolean;
  excluded_from_funding: boolean;
  /** EUR. */
  requested_nfp?: number | null;
  requested_total?: number | null;
  approved_nfp?: number | null;
  approved_total?: number | null;
  submitted_at?: string | null;
  detail_url: string;
}

export interface Itms21IrregularityItem {
  kind: 'irregularity' | 'receivable';
  code: string;
  status?: string | null;
  settled: boolean;
  project_code?: string | null;
  project_name?: string | null;
  irregularity_type?: string | null;
  category?: string | null;
  document_type?: string | null;
  eu_budget_impact: boolean;
  systemic: boolean;
  /** EUR. */
  amount?: number | null;
  to_recover?: number | null;
  recovered?: number | null;
  outstanding: number;
  detected_at?: string | null;
  due_at?: string | null;
}

/** ITMS21+ – EU funds 2021 – 2027. All amounts in EUR. */
export interface Itms21Info {
  projects: {
    count: number;
    total_contracted: number;
    total_disbursed: number;
    currency: string;
    negative_outcomes: number;
    latest: Itms21ProjectItem[];
  };
  applications: {
    count: number;
    approved: number;
    rejected: number;
    total_requested_nfp: number;
    total_approved_nfp: number;
    currency: string;
    latest: Itms21ApplicationItem[];
  };
  irregularities: {
    count: number;
    open: number;
    total_amount: number;
    total_recovered: number;
    total_outstanding: number;
    currency: string;
    entries: Itms21IrregularityItem[];
  };
  procurement: {
    count: number;
    awarded: number;
    total_awarded_value: number | null;
    currency: string;
  };
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
  name?: string | null;
  iban?: string | null;
  bank_code?: string | null;
  street?: string | null;
  city?: string | null;
  postal_code?: string | null;
  country?: string | null;
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
  /** Present only with the `orsr` (or `all`) scope. Equity holders only. */
  shareholders?: Shareholder[];
  /** Present only with the `orsr` (or `all`) scope. Ordered current first, chairman before members. */
  statutory_body?: StatutoryBody[];
  /** Present only with the `orsr` (or `all`) scope. */
  supervisory_board?: RegisteredPerson[];
  /** Present only with the `orsr` (or `all`) scope. `acting_method` carries the procurator acting rule. */
  procurators?: RegisteredPerson[];
  /** Present only with the `orsr` (or `all`) scope. */
  liquidators?: RegisteredPerson[];
  /** Present only with the `orsr` (or `all`) scope. Insolvency, restructuring and settlement administrators. */
  administrators?: RegisteredPerson[];
  /** Present only with the `orsr` (or `all`) scope. */
  founders?: RegisteredPerson[];
  /** Present only with the `orsr` (or `all`) scope. */
  branch_heads?: RegisteredPerson[];
  /** Present only with the `orsr` (or `all`) scope. Merged companies; `ico` links to their record. */
  legal_predecessors?: RegisteredPerson[];
  /** Present only with the `orsr` (or `all`) scope. Registered persons that fit none of the bodies above. */
  other_stakeholders?: RegisteredPerson[];
  /** Present only with the `orsr` (or `all`) scope. Share issues of joint-stock companies. */
  shares?: ShareIssue[];
  tax?: TaxInfo;
  bank_accounts?: BankAccount[];
  contacts?: Contacts;
  financials?: Financials;
  financial_statements?: FinancialStatementsInfo;
  debtor_status?: DebtorStatus;
  insolvency?: InsolvencyInfo;
  commercial_bulletin?: CommercialBulletinInfo;
  public_contracts_summary?: PublicContractsSummary;
  procurement_summary?: ProcurementSummary;
  illegal_employment?: IllegalEmploymentInfo;
  court_decisions?: CourtDecisionsInfo;
  employer_headcount?: EmployerHeadcountInfo | null;
  execution_authorizations?: {
    has_active_authorizations: boolean;
    total_count: number;
    authorizations: ExecutionAuthorization[];
  };
  rpvs?: {
    is_public_sector_partner: boolean;
    registrations: RpvsRegistration[];
  };
  nbs?: NbsInfo;
  soi_travel_agency?: {
    is_registered: boolean;
    name?: string;
    address?: string | null;
    insolvency_provider?: string | null;
    insolvency_amount?: number | null;
    insolvency_valid_from?: string | null;
    insolvency_valid_to?: string | null;
    has_ban?: boolean;
  };
  svps_establishments?: SvpsEstablishment[];
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
  crp_projects?: CrpProjectsInfo;
  itms21?: Itms21Info;
  fs?: FsData;
}

export interface SvpsEstablishment {
  approval_number: string;
  register_type: 'food' | 'vet';
  section_code?: string | null;
  section_label?: string | null;
  activity_code?: string | null;
  activity_label?: string | null;
  name: string;
  city?: string | null;
  district?: string | null;
  region?: string | null;
  match_confidence?: number | null;
  match_method?: string | null;
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
