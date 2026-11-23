import { afterEach, describe, expect, it, vi } from 'vitest';
import { FirmApi } from '../src';
import type { TransportLicenceInfo } from '../src';

function stubFetch(body: unknown) {
  const calls: string[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      calls.push(url);
      return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
    })
  );
  return calls;
}

describe('transport_licence', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('types every licence and permit of the carrier', async () => {
    const licence: TransportLicenceInfo = {
      has_licence: true,
      eurolicence_number: 'TNMN000763010000',
      vehicles_count: 5,
      valid_from: '2023-04-04',
      valid_to: '2033-04-04',
      licences: [
        { kind: 'licence', number: 'TNMN000763010000', transport_type: 'Nákladná cestná doprava', vehicles_count: 5, valid_from: '2023-04-04', valid_to: '2033-04-04', is_valid: true },
        { kind: 'permit', number: 'OU-TN-OCDPK-2019/1', transport_type: null, vehicles_count: 2, valid_from: '2019-01-01', valid_to: '2021-01-01', is_valid: false },
      ],
    };
    const calls = stubFetch({ data: { ico: '31105467', transport_licence: licence } });
    const client = new FirmApi({ apiKey: 'test' });

    const company = await client.companies.byIco('31105467').withTransportLicence().get();

    expect(new URL(calls[0]).searchParams.get('scope')).toBe('transport_licence');
    expect(company.data.transport_licence?.licences?.map((l) => l.kind)).toEqual(['licence', 'permit']);
    expect(company.data.transport_licence?.licences?.[1].is_valid).toBe(false);
  });
});
