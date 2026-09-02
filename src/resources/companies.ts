import type { FirmApi } from '../client';
import type { Company } from '../types';

export class CompanyQuery implements PromiseLike<Company> {
  private scopes: string[] = [];

  constructor(
    private readonly client: FirmApi,
    private readonly path: string,
    private waitForFreshData: boolean,
    private maxStaleRetries: number,
  ) {}

  /**
   * Opt THIS query into waiting for a completed background refresh.
   *
   * By default the SDK returns the API's immediately-available (precomputed)
   * data even when `meta.stale` is set -- that data is valid; the flag only
   * means a refresh is queued. Call fresh() when you specifically need the
   * post-refresh values and can tolerate the added latency (and extra billed
   * re-poll requests).
   */
  fresh(maxRetries?: number): this {
    this.waitForFreshData = true;
    if (maxRetries !== undefined) {
      this.maxStaleRetries = Math.max(0, maxRetries);
    }
    return this;
  }

  /**
   * Add one or more raw scope tokens (e.g. with('tax', 'sanctions')).
   * Prefer the typed withX() helpers; this is an escape hatch for scopes added
   * to the API before a matching helper ships.
   */
  with(...scopes: string[]): this { this.scopes.push(...scopes); return this; }

  withOrsr(): this { this.scopes.push('orsr'); return this; }
  withTax(): this { this.scopes.push('tax'); return this; }
  withBankAccounts(): this { this.scopes.push('bank_accounts'); return this; }
  withContacts(): this { this.scopes.push('contacts'); return this; }
  withFinancials(): this { this.scopes.push('financials'); return this; }
  withDebtorStatus(): this { this.scopes.push('debtor_status'); return this; }
  withFinancialStatements(): this { this.scopes.push('financial_statements'); return this; }
  withInsolvency(): this { this.scopes.push('insolvency'); return this; }
  withCommercialBulletin(): this { this.scopes.push('commercial_bulletin'); return this; }
  withPublicContracts(): this { this.scopes.push('public_contracts'); return this; }
  withProcurement(): this { this.scopes.push('procurement'); return this; }
  withExecutionAuthorizations(): this { this.scopes.push('execution_authorizations'); return this; }
  withRpvs(): this { this.scopes.push('rpvs'); return this; }
  withNbs(): this { this.scopes.push('nbs'); return this; }
  withTaxReliability(): this { this.scopes.push('tax_reliability'); return this; }
  withErasedVat(): this { this.scopes.push('erased_vat'); return this; }
  withReges(): this { this.scopes.push('reges'); return this; }
  withSocialEnterprise(): this { this.scopes.push('social_enterprise'); return this; }
  withGleif(): this { this.scopes.push('gleif'); return this; }
  withSanctions(): this { this.scopes.push('sanctions'); return this; }
  withTedTenders(): this { this.scopes.push('ted_tenders'); return this; }
  withReplikAdministrator(): this { this.scopes.push('replik_administrator'); return this; }
  withSbs(): this { this.scopes.push('sbs'); return this; }
  withTransportLicence(): this { this.scopes.push('transport_licence'); return this; }
  withUtilityLicence(): this { this.scopes.push('utility_licence'); return this; }
  withContractingAuthority(): this { this.scopes.push('contracting_authority'); return this; }
  withDebarred(): this { this.scopes.push('debarred'); return this; }
  withUvoReferences(): this { this.scopes.push('uvo_references'); return this; }
  withFsImports(): this { this.scopes.push('fs_imports'); return this; }
  withIllegalEmployment(): this { this.scopes.push('illegal_employment'); return this; }
  withCourtDecisions(): this { this.scopes.push('court_decisions'); return this; }
  withEmployerHeadcount(): this { this.scopes.push('employer_headcount'); return this; }
  withSoiTravelAgency(): this { this.scopes.push('soi_travel_agency'); return this; }
  withSvpsEstablishments(): this { this.scopes.push('svps_establishments'); return this; }
  withCrpProjects(): this { this.scopes.push('crp_projects'); return this; }
  withTradeLicenseActivities(): this { this.scopes.push('trade_license_activities'); return this; }
  withAll(): this { this.scopes = ['all']; return this; }

  /**
   * Execute the query and return the company data.
   */
  async get(): Promise<Company> {
    let fullPath = this.path;
    if (this.scopes.length > 0) {
      const unique = [...new Set(this.scopes)];
      fullPath += `?scope=${unique.join(',')}`;
    }

    const response = await this.client.get<Company>(fullPath);
    return this.resolveStaleResponse(response, fullPath);
  }

  /**
   * Makes CompanyQuery thenable – allows `await client.company.byIco('...')` directly.
   */
  then<TResult1 = Company, TResult2 = never>(
    onfulfilled?: ((value: Company) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.get().then(onfulfilled, onrejected);
  }

  /**
   * Total wall-clock budget (ms) for the opt-in fresh-data wait, across all
   * re-polls, so fresh() can never block a caller for minutes.
   */
  private static readonly MAX_TOTAL_WAIT_MS = 120000;

  private async resolveStaleResponse(response: Company, path: string): Promise<Company> {
    if (!this.waitForFreshData || !response.meta?.stale) {
      return response;
    }

    let current = response;
    let spent = 0;

    for (let attempt = 0; attempt < this.maxStaleRetries; attempt++) {
      const waitMs = this.calculateWaitMs(current.meta?.retry_at ?? null);

      if (spent + waitMs > CompanyQuery.MAX_TOTAL_WAIT_MS) {
        break;
      }

      if (waitMs > 0) {
        await new Promise(resolve => setTimeout(resolve, waitMs));
        spent += waitMs;
      }

      current = await this.client.get<Company>(path);

      if (!current.meta?.stale) {
        return current;
      }
    }

    return current;
  }

  private calculateWaitMs(retryAt: string | null | undefined): number {
    if (!retryAt) {
      return 5000;
    }

    const retryTime = new Date(retryAt).getTime();
    if (isNaN(retryTime)) {
      return 5000;
    }

    const waitMs = retryTime - Date.now();
    return Math.max(1000, Math.min(waitMs, 60000));
  }
}

export class Companies {
  constructor(private readonly client: FirmApi) {}

  /**
   * Look up a company by IČO (registration number).
   *
   * Can be awaited directly for base data, or chained with enrichment methods:
   *   await client.company.byIco('51636549');                         // base data
   *   await client.company.byIco('51636549').withTax();               // with tax
   *   await client.company.byIco('51636549').withAll();               // everything
   */
  byIco(ico: string): CompanyQuery {
    return new CompanyQuery(
      this.client,
      `/company/ico/${ico}`,
      this.client.waitForFreshData,
      this.client.maxStaleRetries,
    );
  }

  /**
   * Look up a company by ORSR ID.
   */
  byOrsrId(orsrId: string): CompanyQuery {
    return new CompanyQuery(
      this.client,
      `/company/id/${orsrId}`,
      this.client.waitForFreshData,
      this.client.maxStaleRetries,
    );
  }
}
