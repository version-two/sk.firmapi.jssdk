import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiException, FirmApi } from '../src';
import type { BatchAcceptedResponse, BatchResponse, BatchStatusResponse } from '../src';

const ID = '01jfz3k8q7x2m5n9p4r6t8v0wa';

function stubFetch(status: number, body: unknown) {
  const calls: { url: string; method: string; body: string | undefined }[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init: RequestInit) => {
      calls.push({ url, method: init.method ?? 'GET', body: init.body as string | undefined });
      return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
    })
  );
  return calls;
}

const statusData = {
  id: ID,
  type: 'ico' as const,
  status: 'pending' as const,
  total: 2,
  processed: 0,
  found: 0,
  not_found: 0,
  error: null,
  created_at: '2026-11-25T10:00:00+01:00',
  started_at: null,
  completed_at: null,
  expires_at: '2026-12-02T10:00:00+01:00',
};

describe('batch', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('submits IČOs and returns the batch id', async () => {
    const body: BatchAcceptedResponse = {
      data: statusData,
      meta: { status_url: `https://api.firmapi.sk/v1/batch/${ID}/status`, results_url: `https://api.firmapi.sk/v1/batch/${ID}/results` },
    };
    const calls = stubFetch(202, body);

    const res = await new FirmApi({ apiKey: 'k', maxRetries: 0 }).batch.byIco(['51636549', '87654321']);

    expect(res.data.id).toBe(ID);
    expect(calls[0].method).toBe('POST');
    expect(calls[0].url).toContain('/batch/ico');
    expect(JSON.parse(calls[0].body ?? '{}')).toEqual({ icos: ['51636549', '87654321'] });
  });

  it('reads the status and the results of a batch', async () => {
    const statusBody: BatchStatusResponse = { data: { ...statusData, status: 'completed', processed: 2, found: 1, not_found: 1 } };
    let calls = stubFetch(200, statusBody);
    const api = new FirmApi({ apiKey: 'k', maxRetries: 0 });

    const status = await api.batch.status(ID);
    expect(status.data.status).toBe('completed');
    expect(calls[0].url).toContain(`/batch/${ID}/status`);

    const resultsBody: BatchResponse = {
      data: { '51636549': { found: true, data: { id: '51636549', ico: '51636549', name: 'Version Two s. r. o.', address: 'Zámocká 6619/3, 81101 Bratislava', legal_form: null, established_date: null } } },
      meta: { id: ID, type: 'ico', total: 1, found: 1, not_found: 0 },
    };
    vi.unstubAllGlobals();
    calls = stubFetch(200, resultsBody);

    const results = await api.batch.results(ID);
    expect(results.meta.id).toBe(ID);
    expect(calls[0].url).toContain(`/batch/${ID}/results`);
  });

  it('throws a 409 ApiException while the batch is not ready', async () => {
    stubFetch(409, { error: 'batch_not_ready', message: 'Batch is still being processed.', data: statusData });

    const error = await new FirmApi({ apiKey: 'k', maxRetries: 0 }).batch.results(ID).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiException);
    expect((error as ApiException).statusCode).toBe(409);
  });
});
