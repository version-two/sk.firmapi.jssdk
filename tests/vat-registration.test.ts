import { afterEach, describe, expect, it, vi } from 'vitest';
import { FirmApi } from '../src';
import type { VatRegistration } from '../src';

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

describe('vat_registration', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('rides the existing tax scope and types the VAT group membership', async () => {
    const registration: VatRegistration = {
      type: '§4b',
      ic_dph: 'SK2020999001',
      is_group_member: true,
      group_member_count: 3,
      registered_at: '2004-03-15',
      type_changed_at: '2018-01-01',
      vat_payer_since: '2018-01-01',
    };
    const calls = stubFetch({ data: { ico: '11111111', vat_registration: registration } });
    const client = new FirmApi({ apiKey: 'test' });

    const company = await client.companies.byIco('11111111').withTax().get();

    expect(new URL(calls[0]).searchParams.get('scope')).toBe('tax');
    expect(company.data.vat_registration?.is_group_member).toBe(true);
    expect(company.data.vat_registration?.group_member_count).toBe(3);
  });

  it('is absent, not false, when the registration type is unknown', async () => {
    stubFetch({ data: { ico: '33333333' } });
    const client = new FirmApi({ apiKey: 'test' });

    const company = await client.companies.byIco('33333333').withTax().get();

    expect(company.data.vat_registration).toBeUndefined();
  });
});
