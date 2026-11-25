# Changelog

All notable changes to the FirmAPI JavaScript/TypeScript SDK are documented here.

## v3.4.1

Batch lookups are asynchronous, and the types match what the API returns.

### Changed
- Batch lookups are asynchronous. `batch.byIco()` and `batch.byNames()` return a
  `BatchAcceptedResponse` with the batch ID (`data.id`, HTTP 202). Poll `batch.status(id)`
  until `data.status` is `completed`, then call `batch.results(id)`. A batch is processed within
  an hour, costs 1 credit per 2 items (rounded up), and its status and results are free and
  kept for 7 days. Before this release both status endpoints answered 404.
- `batch.results()` throws an `ApiException` with `statusCode` 409 while the batch is pending or
  processing, or after it failed.
- `account.usage()` and `account.quota()` are typed as a union on `billing_mode` (`credits` |
  `legacy`) matching the API. The old `requests_today`, `requests_month`, `limit_daily`,
  `remaining_daily` and related fields never existed.
- `account.history()` takes no argument (the API ignored `days`; the range is set by the plan);
  `HistoryEntry` gains `credits` and `HistoryResponse` carries `meta.history_months`.
- `CompanyData` matches the API: `id` removed (never returned), `address` is a `CompanyAddress`
  object, `registration_date` is `established_date`, `business_activities` is a list, and the
  base fields `legal_form_code`, `terminated_date`, `source_register`, `status` are typed.
  `orsr_id`, `business_activities` and `registered_capital` are optional.

### Added
- Types `BatchStatus`, `BatchStatusResponse`, `BatchAcceptedResponse`, `BatchCompany`,
  `BatchResult`, `BatchNamesResponse`, `BatchNameResult`, `BatchNameMatch`, `BatchType`.
- Types `CompanyAddress`, `CompanyBusinessActivity`, `CreditsUsageData`, `LegacyUsageData`,
  `CreditsQuotaData`, `LegacyQuotaData`, `AccountTier` and the exports `UsageData`, `QuotaData`,
  `HistoryResponse`, `HistoryEntry`.
- `prepare` script: installing from GitHub (`npm install github:version-two/sk.firmapi.jssdk#v3.4.1`)
  now builds `dist`; before, the repository carried no build output, so that install had nothing
  to load.

### Fixed
- README: install command, version, links, sandbox demo IČO, rate limit section (credits and the
  120 requests per minute per key limit), Professional plan requirement for batch.

## v3.4.0

### Added
- `TransportLicenceInfo.licences` (API v1.32.0): every licence and permit of the carrier as
  `TransportLicenceEntry` (`kind` `licence` or `permit`, `number`, `transport_type`,
  `vehicles_count`, `valid_from`, `valid_to`, `is_valid`), valid ones first.
- `TransportLicenceInfo` and `TransportLicenceEntry` are exported from the package root.

### Changed
- `has_licence` is true only when a licence or permit is valid today; the summary fields come
  from the best record (a valid EU licence first).

## v3.3.0

### Added
- `client.companies.groupMembers(icDph, { q, limit, offset })` (API v1.26.0): the members of a
  VAT group, paged, keyed by the group IČ DPH from `vat_registration.ic_dph`. Each member has
  `ico`, `name`, `type` and the registration dates. `meta.total_members` counts every member;
  `meta.members_without_ico` are those the register lists without an IČO, which are never named.
- Types `VatGroupMember`, `VatGroupMembersMeta`, `VatGroupMembersResponse` and
  `VatGroupMembersOptions`.

## v3.2.0

### Added
- Type `VatRegistration` and `CompanyData.vat_registration`: the registration type from the
  VAT payers list of Finančná správa (`type`, e.g. `§4b`), `is_group_member` (VAT group, `§4b`
  or `§4c`), `group_member_count`, `ic_dph` and the registration dates. Returned with the
  existing `tax` scope (`withTax()`), so there is no new helper. The key is absent when the
  company is not listed or the registration type has not been loaded yet.

## v3.1.0

### Added
- Scope helpers `withConvictedEntities()` (register of convicted legal entities, General
  Prosecutor's Office), `withStateAid()` (PPA state aid and de minimis aid, from 2023) and
  `withGrants()` (grant applications and approved amounts from the Ministry of Economy, the
  Ministry of Environment and the Government Office, from 2023).
- Types `ConvictedEntitiesInfo`, `ConvictedEntity`, `Conviction`, `ConvictionAppeal`,
  `ConvictionOffence`, `ConvictionMeasure`, `StateAidInfo`, `StateAidEntry`, `StateAidKind`,
  `StateAidOutcome`, `GrantsInfo`, `GrantEntry`, `GrantProvider`, `GrantStatus` and
  `ElectronicMailbox`, plus `CompanyData.convicted_entities`, `state_aid`, `grants` and `e_box`.
  `e_box` (NASES mailbox activated for delivery, with the month of the list) comes with every
  response and needs no scope.

## v3.0.0

### Breaking
- Financial figures now have one fixed meaning each. `total_revenue` is removed: it held net
  turnover, total income or cash receipts depending on the statement template.
- `Financials` and `FinancialStatement` carry `net_turnover`, `sales_revenue`, `operating_income`,
  `financial_income`, `total_income`, `total_expenses`, `operating_result`, `financial_result`,
  `profit_before_tax`, `income_tax`, `net_profit`, balance sheet totals and `accruals`.
  Single-entry statements (non-profits, sole traders) fill only `total_receipts`,
  `total_expenditures`, `receipts_minus_expenditures`, `property_total`, `debts_total` and
  `property_minus_debts`.
- `template_type` and `size_category` are removed; statements carry `accounting_basis`,
  `template_family` and `figure_sources` (the statement lines each figure was read from).
  `null` means the statement does not publish the figure, never zero.

### Added
- Exported types `AccountingBasis`, `FinancialFigure`, `Financials`, `FinancialStatement`,
  `FinancialStatementsInfo`.

## v2.6.0

### Added
- `NbsEntitySummary.person_match` (API v1.23.0): how a sole-trader agent was linked to a person –
  `address` (same name and address) or `name_postcode` (same name and postcode, a probable match).

## v2.5.0

### Added
- `client.nbs` resource (API v1.22.0) for the NBS register of financial market entities:
  `entities()` (filter by category, sector, parent institution, country, natural person, status),
  `entity()` (full licence history, including foreign entities without an IČO) and `agents()`
  (financial agents working for an institution).
- `NbsInfo` now types the extended `nbs` scope: `licences` (with parent institution and
  current/ended status), `agents_count`, `is_natural_person` and `entity_id`. New types
  `NbsLicence`, `NbsEntitySummary`, `NbsEntityDetail`, `NbsAgent` and the list responses.

## v2.4.0

### Added
- `withItms21()` scope helper and the `Itms21Info` type (API v1.21.0): EU funds 2021 – 2027 from
  ITMS21+ – projects, grant applications, irregularities/receivables and a procurement summary
  under `CompanyData.itms21`.

## v2.3.0

### Added
- Registry people split by body (API v1.20.0): `CompanyData.supervisory_board`, `procurators`,
  `liquidators`, `administrators`, `founders`, `branch_heads`, `legal_predecessors` and `shares`;
  `other_stakeholders` keeps only persons outside those bodies.
- `RegisteredPerson` type (with `function` and, for procurators, `acting_method`), `ShareIssue`
  type and the `PersonFunction` union.

### Changed
- `Shareholder` gained `share_paid`, `share_currency`, `contribution_kind`, `deposit_lien` and `function`.
- `StatutoryBody` gained `function`, `body_type`, `acting_method`, `appointed_at`, `effective_from`,
  `effective_to` and `current`.

### Deprecated
- `OtherStakeholder` is now an alias of `RegisteredPerson`.

## v2.2.0

### Changed
- `Shareholder` now carries `is_company`, `ico`, `stakeholder_type`, `effective_from`,
  `effective_to` and `current` (API v1.19.0). `shareholders` holds equity holders only.

### Added
- `OtherStakeholder` type and `CompanyData.other_stakeholders` – supervisory board
  members, procurators, liquidators, administrators and other registered persons
  without a stake.

## v2.1.0

### Added
- `withOrsr()` scope helper. From API v1.18.0 the base company response no
  longer includes `shareholders`, `statutory_body` and `business_activities`;
  request them with `withOrsr()` (or `withAll()`).

## v2.0.0

Breaking changes to defaults and surface, plus reliability fixes. Mirrors the
PHP SDK v2.0.0.

### Breaking
- **Fast by default.** Company lookups no longer block waiting for a completed
  background refresh. A `meta.stale = true` response (valid, precomputed data
  with a refresh queued) is now returned immediately. Opt into waiting per query
  with `CompanyQuery.fresh()`, or globally via `waitForFreshData: true` in the
  config. Previously `waitForFreshData` defaulted to `true`.
- **Removed `companies.byId(id)`** and the `/company/{id}` numeric-ID lookup.
  Use `byIco()` or `byOrsrId()`.

### Added
- `CompanyQuery.fresh(maxRetries?)` – opt a single query into the bounded
  fresh-data wait.
- `CompanyQuery.with(...scopes)` – raw-scope escape hatch.
- `CompanyQuery.withTradeLicenseActivities()` – ZRSR trade-licence activities.
- Automatic retry of transient failures (HTTP 5xx and network errors) with
  exponential backoff, controlled by the new `maxRetries` config option
  (default 2). HTTP 429 is never silently retried; it raises `RateLimitException`.
- Sandbox can now be enabled three ways: `FirmApi.sandbox()`, the
  `sandbox: true` config option, or the `FIRMAPI_SANDBOX` env var (auto-detected
  in Node). A read-only `client.sandbox` flag exposes the resolved mode.

### Fixed
- Malformed / non-JSON responses now raise `ApiException` instead of surfacing a
  misleading network error or broken value.
- The fresh-data wait is bounded by a total wall-clock budget so it can never
  stack into minutes.

## v1.x

Initial releases: fluent company lookups with enrichment scopes, search, batch,
account resources, typed exceptions, and full TypeScript definitions.
