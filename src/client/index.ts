import "server-only";

import { Daya, type DayaClientConfig } from "@okeke-dev/daya-sdk";

import {
  resolveApiKey,
  resolveOptionalBaseUrl,
  resolveOptionalEnvironment,
} from "../internal/env.js";
import type { DayaNextClientOptions } from "../types/config.js";

/**
 * Create a configured {@link Daya} client for server-side use (Route Handlers,
 * Server Components, Server Actions).
 *
 * Secret values are resolved from environment variables **at call time** —
 * never at module scope — so nothing sensitive is ever inlined into a bundle.
 *
 * @example
 * ```ts
 * import { createDayaClient } from "@okeke-dev/daya-next";
 *
 * // Uses DAYA_API_KEY (sandbox/production inferred from the key prefix).
 * const daya = createDayaClient();
 *
 * // Explicit override (useful for tests, per-tenant keys, or proxies).
 * const daya = createDayaClient({ apiKey: "sk_sandbox_...", baseUrl: "..." });
 * ```
 *
 * Configuration precedence (highest first):
 * 1. Explicit option (`apiKey`, `environment`, `baseUrl`, …)
 * 2. Environment variable (`DAYA_API_KEY`, `DAYA_ENVIRONMENT`, `DAYA_BASE_URL`)
 * 3. SDK defaults (base URL inferred from the API key prefix: `sk_live_` →
 *    production, otherwise sandbox)
 *
 * This entry is server-only: importing it from a Client Component fails the
 * Next.js build, so the API key can never reach the browser.
 */
export function createDayaClient(options: DayaNextClientOptions = {}): Daya {
  return new Daya(resolveDayaConfig(options));
}

/**
 * Async convenience wrapper around {@link createDayaClient}.
 *
 * A fresh client is created for every call; the constructor performs no
 * network I/O and is cheap. Call `createDayaClient` directly when you want a
 * synchronous handle, or wrap `getDayaClient` in React `cache()` for
 * request-scoped reuse:
 *
 * ```ts
 * import { cache } from "react";
 * import { getDayaClient } from "@okeke-dev/daya-next";
 *
 * export const getClient = cache(() => getDayaClient());
 * ```
 *
 * Deliberately free of React imports so the package does not require React at
 * runtime — the choice of memoization strategy (or none) is left to you.
 * Note: the client is never memoized module-wide, because doing so would share
 * one API key/config across every request.
 */
export async function getDayaClient(options: DayaNextClientOptions = {}): Promise<Daya> {
  return createDayaClient(options);
}

function resolveDayaConfig(options: DayaNextClientOptions): DayaClientConfig {
  const { apiKey, environment, baseUrl, timeout, retry, fetch: fetchImpl } = options;
  return {
    apiKey: resolveApiKey(process.env, apiKey),
    environment: environment ?? resolveOptionalEnvironment(process.env),
    baseUrl: baseUrl ?? resolveOptionalBaseUrl(process.env),
    timeout,
    retry,
    fetch: fetchImpl,
  };
}
