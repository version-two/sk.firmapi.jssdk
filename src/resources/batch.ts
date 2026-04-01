import type { FirmApi } from '../client';
import type { BatchResponse, ApiResponse } from '../types';

export interface BatchStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  total: number;
  processed: number;
  created_at: string;
  completed_at?: string;
}

export class Batch {
  constructor(private readonly client: FirmApi) {}

  /**
   * Batch lookup companies by IČO.
   * Requires Starter plan or higher.
   *
   * @param icos - Array of 8-digit IČO numbers
   */
  async byIco(icos: string[]): Promise<BatchResponse> {
    return this.client.post<BatchResponse>('/batch/ico', { icos });
  }

  /**
   * Batch lookup companies by name.
   * Requires Starter plan or higher.
   *
   * @param names - Array of company names
   */
  async byNames(names: string[]): Promise<BatchResponse> {
    return this.client.post<BatchResponse>('/batch/names', { names });
  }

  /**
   * Get batch job status.
   *
   * @param batchId - Batch job ID
   */
  async status(batchId: string): Promise<ApiResponse<BatchStatus>> {
    return this.client.get<ApiResponse<BatchStatus>>(`/batch/${batchId}/status`);
  }

  /**
   * Get batch job results.
   *
   * @param batchId - Batch job ID
   */
  async results(batchId: string): Promise<BatchResponse> {
    return this.client.get<BatchResponse>(`/batch/${batchId}/results`);
  }
}
