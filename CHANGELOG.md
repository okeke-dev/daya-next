# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-09-02

### Fixed

- `createDayaCachedClient` / `getDayaCachedClient` now import React's `cache`
  from `react` instead of `next/cache`. `next/cache` never exported a `cache`
  function (it exposes `revalidatePath`, `revalidateTag`, `unstable_cache`,
  etc.), so the previous import would have thrown `cache is not a function` at
  runtime inside a Server Component render; it type-checked only via a now-
  removed ambient shim. `react` is added as a peer dependency (like `next`).
- `createDayaRouteHandler` returns a Route Handler whose second argument is a
  required `{ params: Promise<TParams> }` — the signature Next.js 15.5's
  generated `RouteContext` type-check expects. Previously the param was
  optional (and `TParams` unmemoized), which failed `next build` type checking
  in Next 15.5 consumers.
- `check:exports` now runs attw with `--profile node16` (the package targets
  Node ≥18.18, so legacy `node10` resolution of the `/server` subpath is out of
  scope) and pins `fflate` to `0.8.2` via `overrides` to work around
  [arethetypeswrong/core#258](https://github.com/arethetypeswrong/arethetypeswrong.github.io/issues/258).
- Example app: fixed `app/page.tsx` to read the SDK's `Rate.base_currency` /
  `quote_currency` fields (the previous `currency` accessor does not exist).

### Added

- `@okeke-dev/daya-next` package scaffold (ESM-first, strict TypeScript, dual
  ESM/CJS output, source maps, declaration files).
- `createDayaClient(options)` / `getDayaClient(options)` — Daya client factory
  with call-time environment resolution (`DAYA_API_KEY`, `DAYA_ENVIRONMENT`,
  `DAYA_BASE_URL`), sandbox/production inference from the API key prefix, and
  explicit-config precedence. Exported from the package root (server-only
  guarded) and the `/server` entry.
- `createDayaCachedClient(options)` / `getDayaCachedClient(options)` —
  request-scoped client caching for React Server Components via React's `cache`
  (`react` is a peer dependency, like `next`): one shared client per request,
  keyed on the `options` argument.
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
