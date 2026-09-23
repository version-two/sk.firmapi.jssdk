import type { FirmApi } from '../client';
import type {
  NbsAgentListResponse,
  NbsEntityDetail,
  NbsEntityListResponse,
  NbsLicenceStatus,
} from '../types';

export interface NbsPageOptions {
  limit?: number;
  offset?: number;
}

export interface NbsEntityFilters extends NbsPageOptions {
  q?: string;
  category?: string;
  sector?: string;
  parent_ico?: string;
  parent_id?: string;
  /** Two-letter code, or `foreign` for everything outside SK. */
  country?: string;
  natural_person?: boolean;
  status?: NbsLicenceStatus | 'all';
}

export interface NbsAgentFilters extends NbsPageOptions {
  q?: string;
  sector?: string;
  natural_person?: boolean;
  status?: NbsLicenceStatus | 'all';
}

/**
 * NBS register of financial market entities: licences, agent → institution
 * relations and their history. Requires the `nbs` feature on your plan.
 */
export class Nbs {
  constructor(private readonly client: FirmApi) {}

  /** List register entities (Slovak and foreign, with or without an IČO). */
  async entities(filters: NbsEntityFilters = {}): Promise<NbsEntityListResponse> {
    return this.client.get<NbsEntityListResponse>('/nbs/entities', this.query(filters));
  }

  /** One entity with its full licence history. */
  async entity(entityId: string): Promise<{ data: NbsEntityDetail }> {
    return this.client.get<{ data: NbsEntityDetail }>(`/nbs/entities/${encodeURIComponent(entityId)}`);
  }

  /** Financial agents working for an institution, each with the licences tying it there. */
  async agents(ico: string, filters: NbsAgentFilters = {}): Promise<NbsAgentListResponse> {
    return this.client.get<NbsAgentListResponse>(
      `/company/ico/${encodeURIComponent(ico)}/nbs-agents`,
      this.query(filters)
    );
  }

  private query(filters: NbsEntityFilters | NbsAgentFilters): Record<string, string | number | boolean> {
    const { limit = 25, offset = 0, ...rest } = filters;
    const query: Record<string, string | number | boolean> = { limit: Math.min(limit, 100), offset };

    Object.entries(rest).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query[key] = value as string | number | boolean;
      }
    });

    return query;
  }
}
