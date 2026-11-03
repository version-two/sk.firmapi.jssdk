import { afterEach, describe, expect, it, vi } from 'vitest';
import { FirmApi } from '../src';
import type { CompanyData } from '../src';

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

describe('open-data scope helpers', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('requests the convicted_entities, state_aid and grants scopes', async () => {
    const calls = stubFetch({ data: { ico: '36123456' } });
    const client = new FirmApi({ apiKey: 'test' });

    await client.companies.byIco('36123456').withConvictedEntities().withStateAid().withGrants().get();

    const url = new URL(calls[0]);
    expect(url.pathname.endsWith('/company/ico/36123456')).toBe(true);
    expect(url.searchParams.get('scope')).toBe('convicted_entities,state_aid,grants');
  });

  it('types the response blocks', async () => {
    const data: Partial<CompanyData> = {
      convicted_entities: {
        listed: true,
        count: 1,
        since: '2024-03-01',
        entries: [
          {
            name: 'Example s. r. o.',
            seat: 'Bratislava',
            detail_url: 'https://www.genpro.gov.sk/example',
            convictions: [{ parsed: true, ruling_date: '2024-03-01', fine_eur: 5000, measures: ['fine', 'procurement_ban'] }],
          },
        ],
      },
      state_aid: {
        listed: true,
        count: 1,
        provided_count: 1,
        provided_total_eur: 915.3,
        since_year: 2024,
        entries: [{ year: 2024, scheme: 'Schéma', kind: 'de_minimis', provided: true, amount_eur: 915.3, outcome: null }],
      },
      grants: {
        listed: true,
        count: 1,
        approved_count: 1,
        approved_total_eur: 12500.5,
        since_year: 2023,
        entries: [{ year: 2023, provider: 'mh', status: 'paid', approved_eur: 12500.5 }],
      },
      e_box: { activated_for_delivery: true, as_of: '2026-10' },
    };
    stubFetch({ data: { ico: '36123456', ...data } });
    const client = new FirmApi({ apiKey: 'test' });

    const company = await client.companies.byIco('36123456').withGrants().get();

    expect(company.data.grants?.entries[0].provider).toBe('mh');
    expect(company.data.state_aid?.provided_total_eur).toBe(915.3);
    expect(company.data.convicted_entities?.entries[0].convictions[0].measures).toContain('procurement_ban');
    expect(company.data.e_box?.as_of).toBe('2026-10');
  });
});
