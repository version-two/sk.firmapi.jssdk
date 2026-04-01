import type { FirmApi } from '../client';
import type { Company } from '../types';

export class CompanyQuery implements PromiseLike<Company> {
  private scopes: string[] = [];

  constructor(
    private readonly client: FirmApi,
    private readonly path: string,
    private readonly waitForFreshData: boolean,
    private readonly maxStaleRetries: number,
  ) {}

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

  private async resolveStaleResponse(response: Company, path: string): Promise<Company> {
    if (!this.waitForFreshData || !response.meta?.stale) {
      return response;
    }

    let current = response;

    for (let attempt = 0; attempt < this.maxStaleRetries; attempt++) {
      const waitMs = this.calculateWaitMs(current.meta?.retry_at ?? null);

      if (waitMs > 0) {
        await new Promise(resolve => setTimeout(resolve, waitMs));
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

  /**
   * Look up a company by internal database ID.
   */
  byId(id: number): CompanyQuery {
    return new CompanyQuery(
      this.client,
      `/company/${id}`,
      this.client.waitForFreshData,
      this.client.maxStaleRetries,
    );
  }
}
