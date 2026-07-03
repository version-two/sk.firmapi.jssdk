# FirmAPI JavaScript/TypeScript SDK

Official JavaScript/TypeScript SDK for [FirmAPI](https://firmapi.sk) - Slovak Company Data API.

## Requirements

- Node.js 18 or higher
- Works in both Node.js and browser environments

## Installation

```bash
npm install firmapi
# or
yarn add firmapi
# or
pnpm add firmapi
```

## Quick Start

```typescript
import FirmApi from 'firmapi';

const client = new FirmApi('your-api-key');

// Get company by IČO
const company = await client.companies.byIco('51636549');
console.log(company.data.name); // "Version Two s. r. o."

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
});
```

Transient failures (HTTP 5xx and network errors) are retried automatically with
exponential backoff, up to `maxRetries`. HTTP 429 is **not** retried — it is
raised as a `RateLimitException` so you control pacing.

### Fresh vs. cached data (important)

FirmAPI serves precomputed company data immediately. When a background refresh
is queued, the response carries `meta.stale = true` — the data you received is
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

Companies are always identified by IČO or ORSR ID — the SDK does not expose
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

Available scope helpers: `withTax`, `withBankAccounts`, `withContacts`,
`withFinancials`, `withDebtorStatus`, `withFinancialStatements`,
`withInsolvency`, `withCommercialBulletin`, `withPublicContracts`,
`withProcurement`, `withExecutionAuthorizations`, `withRpvs`, `withNbs`,
`withTaxReliability`, `withErasedVat`, `withReges`, `withSocialEnterprise`,
`withGleif`, `withSanctions`, `withTedTenders`, `withReplikAdministrator`,
`withSbs`, `withTransportLicence`, `withUtilityLicence`,
`withContractingAuthority`, `withDebarred`, `withUvoReferences`,
`withFsImports`, `withIllegalEmployment`, `withCourtDecisions`,
`withEmployerHeadcount`, `withSoiTravelAgency`, `withSvpsEstablishments`,
`withCrpProjects`, `withTradeLicenseActivities`, `withAll`.

`with(...scopes: string[])` is an escape hatch for raw scope tokens, e.g.
`.with('tax', 'sanctions')`.

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

Batch operations require Starter plan or higher.

```typescript
// Batch lookup by IČO
const results = await client.batch.byIco([
  '51636549',
  '12345678',
  '87654321',
]);

// Batch lookup by names
const results = await client.batch.byNames([
  'Version Two s. r. o.',
  'Example Company',
]);

// Check batch job status
const status = await client.batch.status('batch-id-123');

// Get batch results
const results = await client.batch.results('batch-id-123');
```

### Account

```typescript
// Get current usage
const usage = await client.account.usage();
console.log(`Requests this month: ${usage.data.requests_month}`);

// Get remaining quota
const quota = await client.account.quota();
console.log(`Remaining: ${quota.data.remaining_daily} requests today`);

// Get usage history
const history = await client.account.history(30);
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
    synced_at?: string;
    source?: string;
  };
}
```

Company data includes:

```typescript
interface CompanyData {
  id: number;
  orsr_id: string;
  ico: string;
  name: string;
  address: string;
  registration_date?: string;
  legal_form?: string;
  business_activities?: string;
  registered_capital?: string;
  shareholders?: Shareholder[];
  statutory_body?: StatutoryBody[];
  // Additional fields based on plan:
  tax?: TaxInfo;           // Starter+
  bank_accounts?: BankAccount[]; // Professional+
  contacts?: Contacts;     // Professional+
  financials?: Financials; // Enterprise
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

Rate limits depend on your subscription tier:

| Tier | Per Minute | Per Day | Per Month |
|------|------------|---------|-----------|
| Free | 5 | 10 | 100 |
| Starter | 10 | 100 | 1,000 |
| Professional | 30 | 500 | 10,000 |
| Enterprise | 100 | 5,000 | 100,000 |

## Browser Usage

The SDK uses the standard `fetch` API and works in modern browsers:

```html
<script type="module">
  import FirmApi from 'https://cdn.jsdelivr.net/npm/firmapi/dist/index.mjs';

  const client = new FirmApi('your-api-key');
  const company = await client.companies.byIco('51636549');
  console.log(company);
</script>
```

## Upgrading from v1.x

v2.0 is a behavior/API change:

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

- Documentation: [https://firmapi.sk/docs](https://firmapi.sk/docs)
- Email: support@firmapi.sk
