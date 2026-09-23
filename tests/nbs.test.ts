import { afterEach, describe, expect, it, vi } from 'vitest';
import { FirmApi } from '../src';

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

describe('Nbs resource', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('lists entities with filters and paging', async () => {
    const calls = stubFetch({ data: [{ entity_id: '01k5x2m8q7r3v9t6w4y1z0a2b3', ico: '35697270' }], meta: { limit: 50, offset: 0, has_more: false } });
    const client = new FirmApi({ apiKey: 'test' });

    const page = await client.nbs.entities({ category: 'samostatný finančný agent', natural_person: true, country: '', limit: 500 });

    const url = new URL(calls[0]);
    expect(url.pathname.endsWith('/nbs/entities')).toBe(true);
    expect(url.searchParams.get('category')).toBe('samostatný finančný agent');
    expect(url.searchParams.get('natural_person')).toBe('true');
    expect(url.searchParams.get('limit')).toBe('100');
    expect(url.searchParams.has('country')).toBe(false);
    expect(page.data[0].ico).toBe('35697270');
  });

  it('fetches one entity', async () => {
    const calls = stubFetch({ data: { entity_id: '01k5x2m8q7r3v9t6w4y1z0a2b3', licences: [] } });
    const client = new FirmApi({ apiKey: 'test' });

    const entity = await client.nbs.entity('01k5x2m8q7r3v9t6w4y1z0a2b3');

    expect(new URL(calls[0]).pathname.endsWith('/nbs/entities/01k5x2m8q7r3v9t6w4y1z0a2b3')).toBe(true);
    expect(entity.data.licences).toEqual([]);
  });

  it('lists agents of an institution', async () => {
    const calls = stubFetch({ data: [], meta: { limit: 25, offset: 0, has_more: false, parent: { ico: '31361358' } } });
    const client = new FirmApi({ apiKey: 'test' });

    await client.nbs.agents('31361358', { status: 'ended' });

    const url = new URL(calls[0]);
    expect(url.pathname.endsWith('/company/ico/31361358/nbs-agents')).toBe(true);
    expect(url.searchParams.get('status')).toBe('ended');
    expect(url.searchParams.get('offset')).toBe('0');
  });
});
