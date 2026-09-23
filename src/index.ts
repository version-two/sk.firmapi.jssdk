export { FirmApi, FirmApi as default } from './client';
export { Companies } from './resources/companies';
export { Search } from './resources/search';
export { Batch } from './resources/batch';
export { Account } from './resources/account';
export { Nbs } from './resources/nbs';
export type { NbsEntityFilters, NbsAgentFilters, NbsPageOptions } from './resources/nbs';
export {
  ApiException,
  AuthenticationException,
  RateLimitException,
  ValidationException,
} from './exceptions';
export type {
  FirmApiConfig,
  Company,
  CompanyData,
  SearchResult,
  AutocompleteResponse,
  BatchResponse,
  UsageResponse,
  QuotaResponse,
  ApiResponse,
  FsData,
  FsDphnoEntry,
  FsDphoEntry,
  FsDphzEntry,
  FsDpposEntry,
  FsDphOudEntry,
  FsRdDeductionEntry,
  FsInvestmentDeductionEntry,
  FsPatentBoxEntry,
  FsRegulatedEntry,
  NbsInfo,
  NbsLicence,
  NbsLicenceStatus,
  NbsEntitySummary,
  NbsEntityDetail,
  NbsAgent,
  NbsPageMeta,
  NbsEntityListResponse,
  NbsAgentListResponse,
} from './types';
