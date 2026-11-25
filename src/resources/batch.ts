import type { FirmApi } from '../client';
import type {
  BatchAcceptedResponse,
  BatchNamesResponse,
  BatchResponse,
  BatchStatusResponse,
} from '../types';

/**
 * Asynchronous batch lookups. Requires the Professional plan or higher; the batch
 * size limit depends on the plan. A batch costs 1 credit per 2 items, rounded up,
 * and is processed within an hour. Status and results are free and kept for 7 days.
 */
export class Batch {
  constructor(private readonly client: FirmApi) {}

  /**
   * Submit a batch of IČOs. Returns the batch ID; poll status() and then call results().
   *
   * @param icos - Array of 8-digit IČO numbers
   */
  async byIco(icos: string[]): Promise<BatchAcceptedResponse> {
    return this.client.post<BatchAcceptedResponse>('/batch/ico', { icos });
  }

  /**
   * Submit a batch of company names (up to 5 matches per name).
   *
   * @param names - Array of company names
   */
  async byNames(names: string[]): Promise<BatchAcceptedResponse> {
    return this.client.post<BatchAcceptedResponse>('/batch/names', { names });
  }

  /**
   * Progress of a batch: pending, processing, completed or failed.
   *
   * @param batchId - Batch ID returned by byIco() or byNames()
   */
  async status(batchId: string): Promise<BatchStatusResponse> {
    return this.client.get<BatchStatusResponse>(`/batch/${encodeURIComponent(batchId)}/status`);
  }

  /**
   * Results of a completed batch, keyed by IČO (byIco) or by the name query (byNames).
   * Throws ApiException with status 409 while the batch is not finished or after it failed.
   *
   * @param batchId - Batch ID returned by byIco() or byNames()
   */
  async results(batchId: string): Promise<BatchResponse | BatchNamesResponse> {
    return this.client.get<BatchResponse | BatchNamesResponse>(`/batch/${encodeURIComponent(batchId)}/results`);
  }
}
