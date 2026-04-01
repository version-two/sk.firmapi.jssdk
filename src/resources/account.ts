import type { FirmApi } from '../client';
import type { UsageResponse, QuotaResponse, HistoryResponse } from '../types';

export class Account {
  constructor(private readonly client: FirmApi) {}

  /**
   * Get current period usage statistics.
   */
  async usage(): Promise<UsageResponse> {
    return this.client.get<UsageResponse>('/account/usage');
  }

  /**
   * Get remaining quota for current period.
   */
  async quota(): Promise<QuotaResponse> {
    return this.client.get<QuotaResponse>('/account/quota');
  }

  /**
   * Get usage history.
   *
   * @param days - Number of days to retrieve (default: 30)
   */
  async history(days: number = 30): Promise<HistoryResponse> {
    return this.client.get<HistoryResponse>('/account/history', { days });
  }
}
