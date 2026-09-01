# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `@okeke-dev/daya-next` package scaffold (ESM-first, strict TypeScript, dual
  ESM/CJS output, source maps, declaration files).
- `createDayaClient(options)` / `getDayaClient(options)` — Daya client factory
  with call-time environment resolution (`DAYA_API_KEY`, `DAYA_ENVIRONMENT`,
  `DAYA_BASE_URL`), sandbox/production inference from the API key prefix, and
  explicit-config precedence. Exported from the package root (server-only
  guarded) and the `/server` entry.
- `createDayaCachedClient(options)` / `getDayaCachedClient(options)` —
  request-scoped client caching for React Server Components via `next/cache`
  (`react` remains a non-dependency): one shared client per request, keyed on
  the `options` argument.
- `createDayaWebhookRoute(options)` — App Router webhook Route Handler factory
  with signature verification, typed handler dispatch, idempotency hooks
  (`isProcessed` / `markProcessed`), and `onEvent` observer.
- `verifyDayaWebhook(request, options)` — raw-body webhook verification and
  typed event parsing.
- `createDayaRouteHandler(handler, options)` — App Router API route factory that
  wires a `Daya` client into `{ request, params, daya }` contexts and maps SDK
  errors to HTTP responses. Edge-safe (Web APIs only).
- `dayaApiErrorToResponse(error)` — SDK error → `Response` mapping: 401/400/429/
  504/502/upstream status, with `requestId` preserved in the body and
  `x-request-id` header, and sanitized bodies for unexpected errors.
- `dayaErrorToResponse(error)` — webhook error → HTTP response mapping.
- `DayaNextConfigError` — configuration error thrown at client construction.
- Server-only guard (`server-only` dependency) on all secret-touching modules.
- Root entry `@okeke-dev/daya-next` exposing public types plus the client,
  caching, and route-handler helpers — server-only guarded, so importing the
  runtime entry from a Client Component fails at build time (intended).
- Unit and integration test suites (Vitest, v8 coverage).
- Example Next.js App Router app under `examples/with-app-router`.
- GitHub Actions CI (quality, package, example-build jobs).
- MIT license, contribution, and security docs.

### Documentation

- "Server Actions & data mutations" README section: the recommended Server
  Action pattern (`createDayaClient()` inside a `"use server"` function),
  discriminated `{ ok, data | error }` results (composed via `useActionState`),
  and why a dedicated `createDayaAction` helper is intentionally **not** shipped
  in v0.1 — it adds no security over the `"use server"` + `server-only`
  boundary, and error→UI mapping is inherently app-specific.
- Example app now demonstrates the pattern end-to-end:
  `examples/with-app-router/actions/customers.ts` (action with public-facing
  error mapping, `revalidatePath`) and
  `examples/with-app-router/app/customers/new/page.tsx` (form via
  `useActionState`).
