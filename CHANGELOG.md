# Changelog

All notable changes to the FirmAPI JavaScript/TypeScript SDK are documented here.

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
