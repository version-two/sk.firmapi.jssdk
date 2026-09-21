# Changelog

All notable changes to the FirmAPI JavaScript/TypeScript SDK are documented here.

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
- `CompanyQuery.fresh(maxRetries?)` — opt a single query into the bounded
  fresh-data wait.
- `CompanyQuery.with(...scopes)` — raw-scope escape hatch.
- `CompanyQuery.withTradeLicenseActivities()` — ZRSR trade-licence activities.
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
