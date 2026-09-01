# basic-app

A deliberately small, production-shaped Next.js **App Router** example for
[`@okeke-dev/daya-next`](../../) wired to the
[`@okeke-dev/daya-sdk`](https://github.com/okeke-dev/daya-sdk). It shows exactly
how the two packages relate and where each is responsible.

## How the packages relate

- **`@okeke-dev/daya-sdk`** owns all Daya API behavior: the `Daya` HTTP client,
  every resource (`customers`, `fundingAccounts`, `transfers`, …), the error
  classes, the webhook types, and the webhook cryptography
  (`constructEvent`, `generateSignature`). The example uses it **through**
  daya-next (see `lib/daya.ts` and the Server Actions), plus directly for the
  SDK's `createWebhookHandler` narrowing helpers and error classes.
- **`@okeke-dev/daya-next`** is only an _integration layer_ for the App Router.
  It **does not re-implement** any Daya HTTP call, resource, or signing logic —
  it builds a configured `Daya` client from env, provides an RSC-`cache`d client
  and a route-handler factory, and a webhook route factory that delegates
  verification to the SDK. There is no fake/mock Daya here: the app calls the
  real sandbox API.

## Requirements

- Node.js ≥ 18.18
- A Daya developer account (sandbox mode)

## Install

```bash
cd examples/basic-app
npm install
```

## Environment setup

Copy the example env file and fill in your **sandbox** credentials:

```bash
cp .env.example .env.local
```

`.env.local` loads in development and is gitignored. Keys are **not** prefixed
with `NEXT_PUBLIC_`, so these values are server-only and can never reach the
browser bundle.

| Variable              | Purpose                                                   |
| --------------------- | --------------------------------------------------------- |
| `DAYA_API_KEY`        | Sandbox API key (`sk_sandbox_...`). **Never a live key.** |
| `DAYA_WEBHOOK_SECRET` | Verifies `x-daya-signature` on webhook requests.          |
| `DAYA_ENVIRONMENT`    | Optional; defaults to inference from the key prefix.      |
| `DAYA_BASE_URL`       | Optional base-URL override (e.g. a proxy).                |

### Sandbox setup

1. In your Daya dashboard, generate a **sandbox** API key
   (`sk_sandbox_…`) and put it in `DAYA_API_KEY`.
2. The SDK auto-selects the sandbox endpoint from the `sk_sandbox_` prefix, so
   you usually don't set `DAYA_ENVIRONMENT`. A live `sk_live_…` key would target
   production — never commit one.
3. Nothing here requires a funded account to _create customers or funding
   accounts_; transfers need a recipient and available balance. All operations
   fail safely with typed errors when the sandbox rejects them.

## Run

```bash
npm run dev
# http://localhost:3000
```

Steps to try end-to-end:

1. **Customer** — `/customers/new` creates a customer via a Server Action
   (`app/actions/daya.ts` → `daya.customers.create`).
2. **Funding account** — `/funding/new` provisions an NGN virtual account
   (`daya.fundingAccounts.create`) for a customer. Deposits into that account
   are what your webhooks report.
3. **Transfer** — `POST /api/transfers` creates a transfer
   (`daya.transfers.create`) via the route-handler factory. That route
   demonstrates typed error mapping (e.g. `400` validation → `DayaValidationError`).

Example transfer request:

```bash
curl -X POST http://localhost:3000/api/transfers \
  -H "Content-Type: application/json" \
  -d '{"currency":"NGN","amount":"5000.00","reference":"INV-1","recipient_id":"rec_..."}'
```

## Webhook configuration

Daya sends signed webhooks to a URL you register in your dashboard. Point it at:

```
http://localhost:3000/api/daya/webhook
```

- Route: `app/api/daya/webhook/route.ts`. It uses
  `createDayaWebhookRoute` from `@okeke-dev/daya-next/server`.
- **Runtime**: must stay `nodejs` (the helper verifies signatures with
  `node:crypto`). The route sets `export const runtime = "nodejs"`.
- **Verification**: the SDK's `constructEvent` recomputes the HMAC-SHA256 over
  the raw body and compares it to the `x-daya-signature` header using
  `DAYA_WEBHOOK_SECRET`. A bad signature returns `401` (Daya retries genuine
  failures); a good one returns `200`.
- **Events handled**: `deposit.completed` and `transfer.completed`. Each is
  handled with the SDK's `createWebhookHandler`, which narrows `event.data` to
  the right type. The safe, whitelisted status is recorded and shown on
  `/status`.
- **Local testing**: use a tunnel (e.g. `ngrok http 3000`) and register the
  public URL. To simulate an event, generate a signature for a test payload with
  the SDK's `generateSignature` and `DAYA_WEBHOOK_SECRET`, then POST it with the
  `x-daya-signature` header.

## Project layout

```
app/
  page.tsx                      # static home; no Daya calls
  layout.tsx
  actions/daya.ts               # Server Actions (createCustomer, createFundingAccount)
  api/
    transfers/route.ts          # POST /api/transfers via createDayaRouteHandler
    daya/webhook/route.ts       # POST /api/daya/webhook via createDayaWebhookRoute
  customers/new/                # create-customer form (Server Action)
  funding/new/                  # create-funding-account form (Server Action)
  status/page.tsx               # Server Component: renders webhook status safely
lib/
  daya.ts                       # server-only, RSC-cached Daya client
  webhook-status.ts             # server-only, in-memory whitelisted status store
```

## Security notes

- Daya credentials are resolved at call time from env and guarded by the
  `server-only` marker — importing `@okeke-dev/daya-next` or `lib/daya.ts` in a
  Client Component fails the build.
- The webhook handler stores and renders only a few non-secret fields; raw
  bodies and secrets never leave the server.
