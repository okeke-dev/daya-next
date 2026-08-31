# @okeke-dev/daya-next

> Unofficial community-maintained [Next.js](https://nextjs.org) App Router integration
> layer for the **Daya Business API**, built on top of
> [`@okeke-dev/daya-sdk`](https://www.npmjs.com/package/@okeke-dev/daya-sdk).

Provision the [Daya](https://daya.co) API client, verify and handle webhooks, and
expose typed Route Handlers — all with zero-config environment-variable
resolution, Node.js runtime support, and no client-side bundle.

---

## Features

- **Server-only by design** — `createDayaClient`/`getDayaClient` are guarded by
  the `server-only` marker; importing the package from a Client Component fails
  the Next.js build instead of shipping secret-reading code.
- **Zero-config environment resolution** — reads `DAYA_API_KEY`,
  `DAYA_WEBHOOK_SECRET`, `DAYA_ENVIRONMENT`, and `DAYA_BASE_URL` at call time,
  with sandbox/production inferred from your API key prefix.
- **Typed webhook Route Handlers** — one factory that verifies the
  `x-daya-signature` HMAC (using the SDK's timing-safe verification), parses the
  event, dispatches to typed handlers, and supports idempotent processing.
- **React-free** — `@okeke-dev/daya-next` does **not** depend on `react` or
  `react-dom` at runtime; you choose how to memo `getDayaClient`.
- **Route Handler factory** — `createDayaRouteHandler` wires the client, maps
  SDK errors to correct HTTP statuses, preserves Daya request IDs, and
  sanitizes unexpected failures.
- **Node.js + Edge runtimes** — the client and route helper are Edge-safe
  (Web APIs only); webhook verification requires the Node.js runtime
  (`node:crypto`).

---

## Installation

```sh
npm install @okeke-dev/daya-next
```

- `@okeke-dev/daya-sdk` and `server-only` are installed automatically
  (runtime dependencies — the SDK's errors/types are part of this package's
  public API).
- `next` is a peer dependency (`^15.0.0 || ^16.0.0`).

---

## Quick start

### 1. Configure environment variables

```text
DAYA_API_KEY=sk_sandbox_xxxx
DAYA_WEBHOOK_SECRET=whsec_xxxx
# Optional:
# DAYA_ENVIRONMENT=sandbox      # inferred from the API key prefix if omitted
# DAYA_BASE_URL=https://proxy.example.com
```

> Do **not** prefix these with `NEXT_PUBLIC_` — they are server secrets.

### 2. Create the client (Route Handler / Server Component / Server Action)

```ts
// lib/daya.ts
import { getDayaClient } from "@okeke-dev/daya-next";

export const getClient = getDayaClient;
```

```tsx
// app/page.tsx
import { DayaNextConfigError } from "@okeke-dev/daya-next";
import { getClient } from "@/lib/daya";

export const dynamic = "force-dynamic";

export default async function Page() {
  try {
    const daya = await getClient();
    const { rate } = await daya.rates.get({ from: "NGN", to: "USDC", side: "BUY" });
    return <pre>{JSON.stringify(rate, null, 2)}</pre>;
  } catch (error) {
    if (error instanceof DayaNextConfigError) {
      return <p>Missing Daya API key. Add DAYA_API_KEY to your environment.</p>;
    }
    throw error;
  }
}
```

> **Reuse note:** `getDayaClient` creates a fresh client per call; the `Daya`
> constructor does no network I/O, so this is cheap. For request-scoped reuse,
> wrap it in React [`cache()`](https://nextjs.org/docs/app/api-reference/functions/cache)
> — the package deliberately avoids React imports so the choice is yours, and it
> never memoizes **module-wide** (that would share one API key across every
> request).

### 3. Handle webhooks

```ts
// app/api/webhooks/daya/route.ts
import { createWebhookHandler } from "@okeke-dev/daya-sdk";
import { createDayaWebhookRoute } from "@okeke-dev/daya-next/server";

export const runtime = "nodejs";

export const { POST } = createDayaWebhookRoute({
  handlers: [
    createWebhookHandler("deposit.completed", async (event) => {
      // event.data is typed as NgnDeposit | CryptoDeposit | UsdDeposit
      await creditUserAccount(event.data);
    }),
    createWebhookHandler("transfer.completed", async (event) => {
      // event.data is typed as Transfer
    }),
  ],
});
```

Handlers are **dispatched by every matching handler**; return `200` fast and
perform async work asynchronously. For exactly-once semantics, provide
`isProcessed` / `markProcessed` — duplicates short-circuit to
`200 { status: "ok", duplicate: true }`.

---

## The Daya client helper

`createDayaClient` and `getDayaClient` wrap the SDK's `Daya` client — they add
Next.js-aware configuration resolution and server-only enforcement, and delegate
every HTTP concern (retries, error mapping, resources) to the SDK. No Daya HTTP
behavior is re-implemented here.

```ts
import { createDayaClient } from "@okeke-dev/daya-next";

const daya = createDayaClient(); // configured from the environment
const customer = await daya.customers.get("cus_...");
```

### Where you can (and cannot) import it

| Context                     | Allowed?                               |
| --------------------------- | -------------------------------------- |
| Server Components           | ✅                                     |
| Route Handlers              | ✅ (`export const runtime = "nodejs"`) |
| Server Actions              | ✅                                     |
| Server-only library code    | ✅                                     |
| Client Components / browser | ❌ fails the build (see below)         |

Both `@okeke-dev/daya-next` and `@okeke-dev/daya-next/server` expose the helper.
The package root is the primary entry; the `/server` subpath additionally
re-exports webhook/route-handler utilities. **Neither** is safe to import from a
client bundle.

### Server-only enforcement (how it works)

- Every secret-touching module starts with `import "server-only"`.
  Next.js resolves the `server-only` package using the `react-server` export
  condition and maps it to a no-op for server builds, but keeps the throwing
  variant for anything that crosses into the client graph — so a Client
  Component that imports the package fails at build time:
  `This module cannot be imported from a Client Component module.`
- Secrets resolve from `process.env` **at call time**, never at module scope, so
  even module evaluation leaves nothing sensitive behind.
- The package declares no `sideEffects: false`, ensuring the guard import can
  never be tree-shaken away by a bundler.
- Tests verify enforcement against the **packaged** output: a plain-Node import
  (no `react-server` condition) throws, and one with
  `--conditions=react-server` loads.

### Configuration & precedence

1. **Explicit option** — `apiKey`, `environment`, `baseUrl`, `timeout`, … passed
   to `createDayaClient`/`getDayaClient` are used verbatim.
2. **Environment variable** — `DAYA_API_KEY`, `DAYA_ENVIRONMENT`, `DAYA_BASE_URL`.
3. **SDK default** — base URL inferred from the key prefix: `sk_live_…` →
   production, otherwise sandbox.

| You provide                   | API base URL                            |
| ----------------------------- | --------------------------------------- |
| `sk_sandbox_…` key (no env)   | `https://api.sandbox.daya.co`           |
| `sk_live_…` key (no env)      | `https://api.daya.co`                   |
| `DAYA_ENVIRONMENT=production` | `https://api.daya.co`                   |
| `DAYA_ENVIRONMENT=sandbox`    | `https://api.sandbox.daya.co`           |
| `baseUrl` / `DAYA_BASE_URL`   | your value (overrides all of the above) |

### Explicit configuration

```ts
import { createDayaClient } from "@okeke-dev/daya-next";

// Per-tenant API key, forcing production.
const daya = createDayaClient({
  apiKey: process.env.TENANT_API_KEY,
  environment: "production",
});

// Proxied/gateway base URL override.
const daya = createDayaClient({ baseUrl: "https://gateway.example.com/daya" });
```

Explicit values take precedence over the environment and are useful for tests,
multi-tenant systems, and proxies.

---

## Route Handlers & responses

For API endpoints that talk to Daya, `createDayaRouteHandler` removes the
boilerplate every handler would otherwise repeat — build the client, map SDK
errors to HTTP responses, and sanitize anything unexpected:

```ts
// app/api/transfers/route.ts
import { createDayaRouteHandler } from "@okeke-dev/daya-next";
import { DayaValidationError } from "@okeke-dev/daya-sdk";

export const POST = createDayaRouteHandler(async ({ request, daya }) => {
  const body = (await request.json()) as { amount: string; currency: string; reference: string };

  if (!body.amount) {
    throw new DayaValidationError("amount is required");
  }

  const { transfer } = await daya.transfers.create(body);
  return Response.json(transfer, { status: 201 }); // explicit status, plain Response
});
```

It runs your handler with `{ request, params, daya }`, returns the `Response`
you produce on success, and on failure builds one for you:

| Error                     | Status | Notes                                   |
| ------------------------- | ------ | --------------------------------------- |
| `DayaAuthenticationError` | 401    | `code`, `requestId`                     |
| `DayaValidationError`     | 400    | plus `details`, `validation`            |
| `DayaRateLimitError`      | 429    | `code`, `requestId`                     |
| `DayaTimeoutError`        | 504    |                                         |
| `DayaNetworkError`        | 502    |                                         |
| other `DayaApiError`      | API's  | preserves the upstream status code      |
| anything else             | 500    | sanitized — no stack, no internal leaks |

`Daya` errors keep the SDK's `code` and message, and — when the API provided
one — the **request ID**, echoed back in the JSON body and the `x-request-id`
response header so failures can be traced end to end. Unexpected errors never
leak stack traces or internal messages. `params` is the raw second Route
Handler argument; in Next.js 15+ it is a `Promise`, so `await params` as needed.

Pass explicit client options or a prebuilt client for per-tenant or test setups:

```ts
export const POST = createDayaRouteHandler(handler, {
  client: { apiKey: process.env.TENANT_API_KEY }, // or a Daya instance
});
```

### `Response` vs `NextResponse`

Use the standard Web `Response` API (`Response.json`). For a pure JSON
endpoint `NextResponse` is identical on the wire and adds nothing — its value is
redirects, rewrites, cookie helpers, and middleware. Reach for `NextResponse`
only if a route is also redirecting or setting cookies.

### Node.js vs Edge runtime

`createDayaClient` and `createDayaRouteHandler` use only Web APIs (fetch,
`Response`, `AbortController`) — they run on **both** Node.js and Edge
runtimes. Webhook verification (`/server`: `createDayaWebhookRoute`,
`verifyDayaWebhook`) uses `node:crypto`, so **webhook routes must declare
`export const runtime = "nodejs"`**. Either way, API keys stay server-side.

---

## API surface

### `@okeke-dev/daya-next`

- `createDayaClient(options)` → `Daya` (server-only)
- `getDayaClient(options)` → `Promise<Daya>` (server-only)
- `createDayaRouteHandler(handler, options)` → Route Handler (server-only, Edge-safe)
- `dayaApiErrorToResponse(error)` → `Response` (server-only, Edge-safe)
- `DayaNextConfigError`
- `env.ts` constants: `DAYA_ENV_VARS`, `DAYA_SIGNATURE_HEADER`
- `DayaNextClientOptions`, `DayaWebhookHandler`, `DayaWebhookRouteOptions`
- SDK types re-exported (`Daya`, `DayaClientConfig`, error classes,
  `WebhookEvent`, `DayaEventName`, …) — importing these type-only re-exports is
  safe anywhere, but the runtime entry is intentionally server-only.

### `@okeke-dev/daya-next/server`

Everything from the root entry, plus:

- `createDayaWebhookRoute(options)` → `{ POST }`
- `verifyDayaWebhook(request, options)` → `{ event, rawBody }`
- `dayaErrorToResponse(error)` → `Response`
- `DayaNextConfigError`
- `DAYA_ENV_VARS`, `DAYA_SIGNATURE_HEADER`
- `createWebhookHandler` (re-exported from the SDK)

### Error handling

- `DayaNextConfigError` — required configuration missing/invalid, thrown before
  any request is made.
- `DayaWebhookError` — webhook signature verification/parsing failure
  (`invalid_signature`, `malformed_header`, `invalid_json`,
  `missing_required_fields`, `empty_body`).
- SDK API errors (`DayaAuthenticationError`, `DayaValidationError`,
  `DayaRateLimitError`, `DayaNetworkError`, `DayaTimeoutError`) propagate
  unchanged from client resource calls.

---

## Security

- Secrets are read at **call time**, never at module scope, and never inlined
  into bundles.
- Webhook signatures are verified over the **exact raw body** using the SDK's
  timing-safe comparison — never re-serialize a parsed body.
- The runtime entry is guarded by `server-only`: importing it from a Client
  Component fails the build instead of exposing secret-reading code, and the
  guard survives bundling (no `sideEffects: false`).
- `dayaApiErrorToResponse` returns sanitized error bodies — no stack traces, no
  internal messages, no secrets; Daya request IDs are preserved for tracing.

See [SECURITY.md](./SECURITY.md) for details and responsible-disclosure contact.

---

## Development

```sh
npm install       # installs dependencies (Node >= 18.18)
npm run typecheck # strict TypeScript, no emit
npm run lint      # ESLint (flat config)
npm run format    # Prettier
npm test          # Vitest (unit + integration)
npm run build     # tsup: ESM + CJS + declarations + sourcemaps
npm run check:exports # publint + AreTheTypesWrong
npm run ci        # everything end-to-end
```

Test live webhook signing locally with the SDK's `generateSignature` helper —
see [tests/helpers/webhooks.ts](tests/helpers/webhooks.ts).

---

## License

MIT © [2026-2030] Okeke Chimezie Glory. See [LICENSE](./LICENSE).

_Unofficial community package. Not affiliated with Daya Inc._
