# FirmAPI JavaScript/TypeScript SDK

Official JavaScript/TypeScript SDK for [FirmAPI](https://firmapi.sk) - Slovak Company Data API.

## Requirements

- Node.js 18 or higher
- Works in both Node.js and browser environments

## Installation

The package is not published to the npm registry yet. Install it from GitHub,
pinned to a release tag (the built package lives in `dist` in the repository):

```bash
npm install github:version-two/sk.firmapi.jssdk#v3.4.1
# or
yarn add github:version-two/sk.firmapi.jssdk#v3.4.1
# or
pnpm add github:version-two/sk.firmapi.jssdk#v3.4.1
```

> These docs cover **v3.x**. Upgrading? See [Upgrading](#upgrading) and
> [CHANGELOG.md](CHANGELOG.md) for the breaking changes.

## Quick Start

```typescript
import FirmApi from 'firmapi';

const client = new FirmApi('your-api-key');

// Get company by IČO
const company = await client.companies.byIco('51636549');
console.log(company.data.name); // "Version Two s. r. o."
console.log(company.data.address.city);

// Search companies
const results = await client.search.autocomplete('version');
results.results.forEach(result => {
  console.log(`${result.text} (${result.ico})`);
});
```

## Usage

### Initialize the Client

```typescript
import FirmApi from 'firmapi';

// Basic initialization
const client = new FirmApi('your-api-key');

// With custom options (defaults shown)
const client = new FirmApi({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.firmapi.sk/v1', // optional override
  timeout: 30000,          // per-request timeout (ms)
  waitForFreshData: false, // block/re-poll until non-stale (opt-in)
  maxStaleRetries: 3,      // re-polls when waiting for fresh data
  maxRetries: 2,           // retries for transient 5xx/network errors
  sandbox: false,          // force sandbox; omit to auto-detect FIRMAPI_SANDBOX env
});
```

Transient failures (HTTP 5xx and network errors) are retried automatically with
exponential backoff, up to `maxRetries`. HTTP 429 is **not** retried – it is
raised as a `RateLimitException` so you control pacing.

### Sandbox mode

The sandbox needs no API key, returns demo data, and has no rate limits. Enable
it either way:

```typescript
// 1. Explicit factory (or config flag)
const client = FirmApi.sandbox();
const client = new FirmApi({ apiKey: 'ignored', sandbox: true });

// 2. Environment variable (Node) – set before starting your app
//    FIRMAPI_SANDBOX=true
const client = new FirmApi('ignored'); // auto-detected -> sandbox
```

When sandbox is active the base URL and key are overridden with the built-in
sandbox endpoint automatically, so any key you pass is ignored. An explicit
`sandbox: true | false` in the config always wins over the env var.

The sandbox only knows ten demo companies, for example `36421928` (Websupport)
or `31333532` (ESET). Any other IČO, including `51636549` used in the examples
below, answers 404 there. The `GET /v1/sandbox/companies` endpoint lists them.

### Fresh vs. cached data (important)

FirmAPI serves precomputed company data immediately. When a background refresh
is queued, the response carries `meta.stale = true` – the data you received is
still valid; the flag only tells you a newer version is being prepared.

By default (since v2.0) the SDK returns that immediately-available data without
waiting. If you specifically need the post-refresh values and can tolerate the
extra latency and billed re-poll requests, opt in per query with `fresh()`:

```typescript
// Fast (default): resolves immediately, even if meta.stale is true
const company = await client.companies.byIco('51636549').get();

// Wait for a completed refresh (re-polls, bounded)
const fresh = await client.companies.byIco('51636549').fresh().get();
```

### Companies

```typescript
// Get company by IČO (8-digit registration number).
// The query is thenable, so `await` resolves it directly; .get() is equivalent.
const company = await client.companies.byIco('51636549');

// Get company by ORSR ID
const company = await client.companies.byOrsrId('427482');
```

Companies are always identified by IČO or ORSR ID – the SDK does not expose
internal numeric database identifiers.

#### Enrichment scopes

Request additional datasets with the fluent `withX()` helpers (each maps to an
API `scope`, subject to your plan's features), then resolve the query:

```typescript
const company = await client.companies.byIco('51636549')
  .withTax()
  .withFinancials()
  .withSanctions()
  .get();

// Everything your plan is entitled to
const all = await client.companies.byIco('51636549').withAll().get();
```

Available scope helpers: `withOrsr` (commercial register people and bodies:
shareholders, statutory body, procurators and so on), `withTax`, `withBankAccounts`, `withContacts`,
`withFinancials`, `withDebtorStatus`, `withFinancialStatements`,
`withInsolvency`, `withCommercialBulletin`, `withPublicContracts`,
`withProcurement`, `withExecutionAuthorizations`, `withRpvs`, `withNbs`,
`withTaxReliability`, `withErasedVat`, `withReges`, `withSocialEnterprise`,
`withGleif`, `withSanctions`, `withTedTenders`, `withReplikAdministrator`,
`withSbs`, `withTransportLicence`, `withUtilityLicence`,
`withContractingAuthority`, `withDebarred`, `withUvoReferences`,
`withFsImports`, `withIllegalEmployment`, `withCourtDecisions`,
`withEmployerHeadcount`, `withSoiTravelAgency`, `withSvpsEstablishments`,
`withCrpProjects`, `withItms21`, `withConvictedEntities`, `withStateAid`,
`withGrants`, `withTradeLicenseActivities`, `withAll`.

`with(...scopes: string[])` is an escape hatch for raw scope tokens, e.g.
`.with('tax', 'sanctions')`.

`data.e_box` (NASES electronic mailbox activated for delivery, with the month of
the published list) is returned on every request and needs no scope.

#### VAT groups

`withTax()` returns `vat_registration` (`is_group_member`, `group_member_count`, `ic_dph`).
The other members of the group are one call away, keyed by that IČ DPH (requires a plan
with tax data):

```typescript
const { data } = await client.companies.byIco('34109340').withTax().get();
const icDph = data.vat_registration?.ic_dph;

if (data.vat_registration?.is_group_member && icDph) {
  const page = await client.companies.groupMembers(icDph, { limit: 50 });
  page.data.forEach((m) => console.log(m.ico, m.name, m.type));

  // page.meta.total_members counts every member; members_without_ico are
  // listed by the register without an IČO and are never named.
  // Search by name, or by IČO prefix when numeric:
  await client.companies.groupMembers(icDph, { q: 'holding' });
}
```

### NBS register

Financial market entities supervised by Národná banka Slovenska, their licences and
agent → institution relations with history (requires the `nbs` feature):

```typescript
// Every independent financial agent in the insurance sector
const page = await client.nbs.entities({
  category: 'samostatný finančný agent',
  sector: 'sektor poistenia alebo zaistenia',
  limit: 50,
});

// Agents that used to work for an institution
const former = await client.nbs.agents('31361358', { status: 'ended' });

// One entity (also foreign ones without an IČO) with full licence history
const entity = await client.nbs.entity(page.data[0].entity_id);
```

### Search

```typescript
// Autocomplete (Select2-compatible format)
const results = await client.search.autocomplete('version', 10);
// Returns: { results: [{id, text, ico, city}], pagination: {more} }

// Search by name
const results = await client.search.byName('Version Two');

// Search by name (exact match)
const results = await client.search.byName('Version Two s. r. o.', { exact: true });

// Search by partial IČO
const results = await client.search.byIco('5163');

// Advanced search
const results = await client.search.advanced({
  name: 'version',
  city: 'Bratislava',
  limit: 20,
});
```

### Batch Operations

Batch operations require the Professional plan or higher. The maximum number of
items per batch depends on your plan (Professional 100, Enterprise 1,000). A batch
costs 1 credit per 2 items (rounded up) and is processed asynchronously within an
hour, when the server is less busy. Status and results are free and kept for 7 days.

```typescript
// Submit a batch by IČO (or client.batch.byNames([...]))
const { data: batch } = await client.batch.byIco([
  '51636549',
  '12345678',
  '87654321',
]);
// batch: { id, type, status: 'pending', total, processed, ... }

// Poll the status (free)
const { data: state } = await client.batch.status(batch.id);
// state.status: 'pending' | 'processing' | 'completed' | 'failed'

// Once completed, download the results (free); 409 while not finished
if (state.status === 'completed') {
  const { data, meta } = await client.batch.results(batch.id);
  // keyed by IČO for byIco(), by the name query for byNames()
}
```

### Account

Responses depend on how your account is billed. Narrow on `data.billing_mode`
(`credits` or `legacy`):

```typescript
// Current period usage
const usage = await client.account.usage();
if (usage.data.billing_mode === 'credits') {
  console.log(`Credits used: ${usage.data.credits.used_this_period}`);
  console.log(`Balance: ${usage.data.credits.balance}`);
}

// Remaining quota
const quota = await client.account.quota();
if (quota.data.billing_mode === 'credits') {
  console.log(`Credits remaining: ${quota.data.credits_remaining}`);
}

// Daily usage history; the range is set by your plan (meta.history_months)
const history = await client.account.history();
history.data.forEach((day) => console.log(day.date, day.requests, day.credits));
```

## TypeScript Support

The SDK is written in TypeScript and includes full type definitions:

```typescript
import FirmApi, {
  Company,
  CompanyData,
  SearchResult,
  AutocompleteResponse,
  BatchResponse,
} from 'firmapi';

const client = new FirmApi('your-api-key');

// Full type inference
const company: Company = await client.companies.byIco('51636549');
const data: CompanyData = company.data;

console.log(data.name);
console.log(data.shareholders?.[0]?.name);
```

## Response Format

All API responses follow this structure:

```typescript
interface ApiResponse<T> {
  data: T;
  meta?: {
    stale?: boolean;
    source?: string;
  };
}
```

Company data (base fields; enrichment scopes add more, see `CompanyData` in the
type definitions):

```typescript
interface CompanyData {
  ico: string;
  name: string;
  legal_form: string | null;
  address: { street; city; postal_code; country };
  established_date: string | null;
  terminated_date: string | null;
  status: string | null;
  orsr_id?: string;                // commercial register companies
  business_activities?: { activity: string; since?: string }[];
  registered_capital?: string | null;
  shareholders?: Shareholder[];    // with the orsr scope
  statutory_body?: StatutoryBody[];
  tax?: TaxInfo;                   // with the tax scope
  vat_registration?: VatRegistration;
  financials?: Financials;         // with the financials scope
}
```

## Error Handling

```typescript
import FirmApi, {
  ApiException,
  AuthenticationException,
  RateLimitException,
  ValidationException,
} from 'firmapi';

const client = new FirmApi('your-api-key');

try {
  const company = await client.companies.byIco('51636549');
} catch (error) {
  if (error instanceof AuthenticationException) {
    // Invalid API key (401)
    console.error(`Authentication failed: ${error.message}`);
  } else if (error instanceof RateLimitException) {
    // Too many requests (429)
    console.error(`Rate limit exceeded. Retry after ${error.retryAfter} seconds`);
  } else if (error instanceof ValidationException) {
    // Invalid parameters (422)
    console.error(`Validation error: ${error.message}`);
    console.error(error.errors);
  } else if (error instanceof ApiException) {
    // Other API errors
    console.error(`API error (${error.statusCode}): ${error.message}`);
  }
}
```

## Rate Limits

Usage is metered in credits: one API call costs one credit, cached and error
responses cost nothing. Each plan grants a monthly credit balance; see the
[pricing page](https://firmapi.sk/en/pricing) for the current plans.
Independently of the plan, one API key may send at most 120 requests per
minute; beyond that the API answers 429 and the SDK throws `RateLimitException`
(`retryAfter` is read from the `Retry-After` header, 60 seconds when absent).

## Browser Usage

The SDK uses the standard `fetch` API and works in modern browsers when bundled
with your application (`import FirmApi from 'firmapi'`). Do not ship a
production API key to a browser; call the API from your own backend.

## Upgrading

### v3.4.1

v3.4.1 follows the API's asynchronous batch flow and corrects the types to
what the API returns:

- **Batches are asynchronous.** `byIco()` / `byNames()` return the batch ID;
  `batch.status(id)` reports progress and `batch.results(id)` returns the
  results once the status is `completed`.
- **`account.usage()`, `account.quota()` and `account.history()` have real
  types.** Responses are a union on `billing_mode` (`credits` | `legacy`);
  `requests_month`, `remaining_daily` and the other old fields never existed.
  `history()` takes no argument (the range is set by your plan) and entries
  carry `credits`.
- **`CompanyData` matches the API.** The `id` field was never returned and is
  gone; `address` is an object, `registration_date` is `established_date`, and
  `business_activities` is a list.

### From v2.x to v3.0

`total_revenue` was removed from `Financials` and `FinancialStatement`; each
figure now has one fixed meaning. See [CHANGELOG.md](CHANGELOG.md).

### From v1.x to v2.0

- **Fast by default.** Lookups no longer block waiting for a background refresh.
  If you relied on the old auto-wait, call `.fresh()` per query, or set
  `waitForFreshData: true` in the config.
- **`companies.byId(id)` was removed.** Use `byIco()` or `byOrsrId()`.
- **Transient retries added.** 5xx/network errors are retried (`maxRetries`,
  default 2); 429 still raises `RateLimitException`.
- **Malformed responses now throw** `ApiException` instead of resolving with a
  broken value.

## License

MIT License. See [LICENSE](LICENSE) for details.

## Support

- Documentation: [https://firmapi.sk/en/docs](https://firmapi.sk/en/docs)
- SDK overview: [https://firmapi.sk/en/docs/sdk](https://firmapi.sk/en/docs/sdk)
- Contact form: [https://firmapi.sk/en/contact](https://firmapi.sk/en/contact)
