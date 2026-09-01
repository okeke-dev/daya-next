# Integration Audit: `@okeke-dev/daya-next` depends on, and extends, `@okeke-dev/daya-sdk`

Date: 2026-09-01

**Objective:** prove that `@okeke-dev/daya-next` genuinely _depends on and
extends_ `@okeke-dev/daya-sdk` rather than duplicating it.

**Result: PASS — zero violations.** All ten checks below were verified against
the source (`src/`), the built package (`dist/`), the packed tarball, and a
clean-room consumer that installed the tarball.

> A single `class Daya` grep hit is a false positive: it is the comment
> `// node:crypto …` in `src/route-handler/index.ts:27`, which documents that
> webhook cryptography lives in the SDK. There is no webhook crypto, HTTP
> client, or resource implementation in daya-next.

## Criterion-by-criterion evidence

| #   | Claim                                                              | Result | Evidence                                                                                                                                                                                                                                                                                                                                                                   |
| --- | ------------------------------------------------------------------ | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `daya-next` imports the SDK from its package dependency            | ✅     | `package.json` → `dependencies: { "@okeke-dev/daya-sdk": "^0.1.0" }`; `src/` imports `Daya`, `DayaClientConfig`, `constructEvent`, `createWebhookHandler` from it                                                                                                                                                                                                          |
| 2   | No Daya HTTP implementation in `daya-next`                         | ✅     | `dist/index.js` does `import { Daya } from "@okeke-dev/daya-sdk"` (externalized, not bundled). No `class Daya`, `class HttpClient`, or HTTP-client body anywhere in `src/` or `dist/`                                                                                                                                                                                      |
| 3   | No duplicate Daya API resource implementations                     | ✅     | No resource classes (`CustomersResource`, `FundingAccountsResource`, `TransfersResource`, …) are defined in `src/` or `dist/`. daya-next only re-exports SDK types and calls SDK resources                                                                                                                                                                                 |
| 4   | No duplicate webhook cryptography                                  | ✅     | `src/webhooks/index.ts` delegates to the SDK's `constructEvent`; `src/server/index.ts` re-exports the SDK's `createWebhookHandler`. Zero `node:crypto`/`createHmac`/`createSign` in daya-next source or dist                                                                                                                                                               |
| 5   | SDK types are reused                                               | ✅     | `dist/index.d.ts`: `import { DayaClientConfig, DayaEventName, WebhookEvent, Daya } from '@okeke-dev/daya-sdk'` and `export { … } from '@okeke-dev/daya-sdk'`. Every SDK type is re-exported, not re-declared                                                                                                                                                               |
| 6   | SDK errors are reused                                              | ✅     | `DayaApiError`, `DayaValidationError`, `DayaWebhookError`, `DayaRateLimitError`, `DayaTimeoutError`, `DayaNetworkError`, `DayaAuthenticationError` are re-exported from the SDK and used/styled by daya-next's handlers                                                                                                                                                    |
| 7   | `npm install` pulls the correct SDK dependency                     | ✅     | Packed tarball → clean-room `npm install` produces `node_modules/@okeke-dev/daya-sdk@0.1.0` + `server-only@^0.0.1` as daya-next's own `dependencies`                                                                                                                                                                                                                       |
| 8   | Clean project can install only `@okeke-dev/daya-next` and use Daya | ✅     | Clean-room consumer typechecks (`tsc --noEmit` exit 0) and `import()`s the public API; `createDayaClient`/`getDayaClient`/`createDayaCachedClient` return SDK `Daya`, and `daya.customers.*`, `daya.fundingAccounts.*` are SDK-typed                                                                                                                                       |
| 9   | Exports do not expose internal implementation                      | ✅     | Installed tarball root → `createDayaClient, getDayaClient, createDayaCachedClient, getDayaCachedClient, createDayaRouteHandler, dayaApiErrorToResponse, DAYA_ENV_VARS, DAYA_SIGNATURE_HEADER`. `/server` → the same plus `createDayaWebhookRoute, verifyDayaWebhook, createWebhookHandler, dayaErrorToResponse, DayaNextConfigError`. No `internal/*` modules are exported |
| 10  | Secrets cannot be bundled into client-side code                    | ✅     | Root entry imported outside a React-server context throws `This module cannot be imported from a Client Component module.` (`server-only` survives into `dist/server.js` as real `import "server-only"`). With `--conditions=react-server` it loads (real RSC render OK)                                                                                                   |

## Built-package inspection

- `npm pack --dry-run` → tarball ships **16 files**: `dist/*` (js, cjs, d.ts,
  d.cts, maps), `package.json`, `README.md`, `CHANGELOG.md`, `LICENSE`. No
  `src/`, no `.env*`, no tests, no SDK source. `files` is correctly restricted.
- `dist/*.js` imports `@okeke-dev/daya-sdk` externally — the SDK is never
  inlined — and imports `server-only`/`react` (real statements) so the server
  guard and RSC cache primitive both survive bundling.

## Clean-room consumer verification

Performed in a throwaway project (registry = `https://registry.npmjs.org/`):

1. Packed the tarball: `npm pack` → `@okeke-dev/daya-next-0.1.0.tgz`.
2. `package.json` declared `@okeke-dev/daya-next` from the tarball (simulating
   the published artifact) plus peers `next` + `react`.
3. `npm install` pulled `@okeke-dev/daya-sdk@0.1.0` and `server-only`.
4. `src/consumer.ts` imported the **public API** from the root and `/server`,
   called `daya.customers.create` / `daya.fundingAccounts.get`, used SDK errors
   (`instanceof DayaApiError`), and built a webhook route + handler.
5. `tsc --noEmit` → `exit 0`. `node --conditions=react-server` → package loads
   and exposes the expected exports.

The clean-room run also independently confirms the earlier `react`-`cache` fix:
`createDayaCachedClient` resolves and is exported under the `react-server`
condition (the `next/cache` shim that previously passed type-checking is gone).

## Proposed fixes

**None required.** The audit found no duplication or mis-attribution. Two
intentional, non-violation design notes:

- Both examples list `@okeke-dev/daya-sdk` as a **direct** dependency so
  readers can call SDK error classes and type guards themselves. That is fine
  for demos; a consumer who only needs the Daya integration gets the SDK
  transitively via `@okeke-dev/daya-next`.
- `docs/` is gitignored for local planning notes, so this permanent verification
  record lives at the repository root instead.
