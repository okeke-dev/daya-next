import "server-only";

import { Daya, type DayaClientConfig } from "@okeke-dev/daya-sdk";

import {
  resolveApiKey,
  resolveOptionalBaseUrl,
  resolveOptionalEnvironment,
} from "../internal/env.js";
import type { DayaNextClientOptions } from "../types/config.js";

/**
 * Create a configured `Daya` client for use in Route Handlers, Server
 * Components and Server Actions.
 *
 * Secret values are resolved from environment variables at call time — never
 * at module scope — so nothing sensitive is ever inlined into a bundle.
 */
export function createDayaClient(options: DayaNextClientOptions = {}): Daya {
  return new Daya(resolveDayaConfig(options));
}

/**
 * Async convenience wrapper. A fresh client is created for every call; wrap
 * this function in React `cache()` (or your own memo) when request-scoped
 * reuse is desired.
 *
 * Deliberately free of React imports so the package does not require React at
 * runtime.
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
