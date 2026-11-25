import type { FirmApi } from '../client';
import type { UsageResponse, QuotaResponse, HistoryResponse } from '../types';

export class Account {
  constructor(private readonly client: FirmApi) {}

  /**
   * Get current period usage. Narrow on `data.billing_mode` (`credits` or `legacy`).
   */
  async usage(): Promise<UsageResponse> {
    return this.client.get<UsageResponse>('/account/usage');
  }

  /**
   * Get the remaining quota. Narrow on `data.billing_mode` (`credits` or `legacy`).
   */
  async quota(): Promise<QuotaResponse> {
    return this.client.get<QuotaResponse>('/account/quota');
  }

  /**
   * Get daily usage history. The range is set by your plan (`meta.history_months`).
   */
  async history(): Promise<HistoryResponse> {
    return this.client.get<HistoryResponse>('/account/history');
  }
}
