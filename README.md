# @okeke-dev/daya-next

> Unofficial community-maintained [Next.js](https://nextjs.org) App Router integration
> layer for the **Daya Business API**, built on top of
> [`@okeke-dev/daya-sdk`](https://www.npmjs.com/package/@okeke-dev/daya-sdk).

Provision the [Daya](https://daya.co) API client, verify and handle webhooks, and
expose typed Route Handlers — all with zero-config environment-variable
resolution, Node.js runtime support, and no client-side bundle.

---

## Features

- **Server-only by design** — secret-touching code is imported exclusively
  through the `/server` entry; next to nothing ships to the client.
- **Zero-config environment resolution** — reads `DAYA_API_KEY`,
  `DAYA_WEBHOOK_SECRET`, `DAYA_ENVIRONMENT`, and `DAYA_BASE_URL` at call time.
- **Typed webhook Route Handlers** — one factory that verifies the
  `x-daya-signature` HMAC (using the SDK's timing-safe verification), parses the
  event, dispatches to typed handlers, and supports idempotent processing.
- **React-free** — `@okeke-dev/daya-next` does **not** depend on `react` or
  `react-dom` at runtime; you choose how to memo `getDayaClient`.
- **Node.js runtime** — works with Route Handlers, Server Components, and Server
  Actions. Next.js Edge Runtime is **not** supported (webhook verification
  requires `node:crypto`).

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
import { getDayaClient } from "@okeke-dev/daya-next/server";

export const getClient = getDayaClient;
```

```tsx
// app/page.tsx
import { DayaNextConfigError } from "@okeke-dev/daya-next/server";
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

> **Reuse note:** `getDayaClient` creates a fresh client per call. Wrap it with
> React [`cache()`](https://nextjs.org/docs/app/api-reference/functions/cache)
> if you need request-scoped reuse — the package deliberately avoids importing
> React so it can never leak into a client bundle.

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

## Manual client

```ts
import { createDayaClient } from "@okeke-dev/daya-next/server";

export const { POST } = createDayaWebhookRoute...;

const daya = createDayaClient({
  apiKey: process.env.DAYA_API_KEY,
  baseUrl: "https://api.sandbox.daya.co",
});
```

Values provided explicitly are used verbatim; anything omitted is resolved from
the environment at call time.

---

## API surface

### `@okeke-dev/daya-next`

Types only (plus constants and type-only SDK re-exports). Safe to import from
anywhere, including client components — nothing sensitive is evaluated.

- `types.ts` types: `DayaNextClientOptions`, `DayaWebhookHandler`,
  `DayaWebhookRouteOptions`
- `env.ts` constants: `DAYA_ENV_VARS`, `DAYA_SIGNATURE_HEADER`
- SDK types re-exported (`Daya`, `DayaClientConfig`, error classes,
  `WebhookEvent`, `DayaEventName`, …)

### `@okeke-dev/daya-next/server`

- `createDayaClient(options)` → `Daya`
- `getDayaClient(options)` → `Promise<Daya>`
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
- No client-side package surface exposes secrets; the root entry contains types
  and constants only.

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
