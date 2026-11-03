import { afterEach, describe, expect, it, vi } from 'vitest';
import { FirmApi } from '../src';
import type { VatGroupMembersResponse } from '../src';

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

describe('companies.groupMembers', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('pages the members of a VAT group keyed by the group IČ DPH', async () => {
    const body: VatGroupMembersResponse = {
      data: [
        {
          ico: '22222222',
          name: 'Alfa Logistika s.r.o.',
          type: '§4c',
          registered_at: '2012-05-02',
          type_changed_at: '2018-01-01',
          vat_payer_since: '2018-01-01',
        },
      ],
      meta: { ic_dph: 'SK2020999001', total_members: 3, members_without_ico: 1, limit: 25, offset: 0, has_more: false },
    };
    const calls = stubFetch(body);
    const client = new FirmApi({ apiKey: 'test' });

    const page = await client.companies.groupMembers('SK2020999001');

    const url = new URL(calls[0]);
    expect(url.pathname.endsWith('/vat-groups/SK2020999001/members')).toBe(true);
    expect(url.searchParams.get('limit')).toBe('25');
    expect(url.searchParams.get('offset')).toBe('0');
    expect(url.searchParams.has('q')).toBe(false);
    expect(page.data[0].ico).toBe('22222222');
    expect(page.meta.total_members).toBe(3);
    expect(page.meta.members_without_ico).toBe(1);
  });

  it('passes the search, clamps the page size and encodes the path', async () => {
    const calls = stubFetch({ data: [], meta: { ic_dph: 'SK2020999001', total_members: 3, members_without_ico: 1, limit: 100, offset: 50, has_more: false } });
    const client = new FirmApi({ apiKey: 'test' });

    await client.companies.groupMembers('SK2020/999001', { q: 'holding', limit: 500, offset: 50 });

    const url = new URL(calls[0]);
    expect(url.pathname.endsWith('/vat-groups/SK2020%2F999001/members')).toBe(true);
    expect(url.searchParams.get('q')).toBe('holding');
    expect(url.searchParams.get('limit')).toBe('100');
    expect(url.searchParams.get('offset')).toBe('50');
  });
});
