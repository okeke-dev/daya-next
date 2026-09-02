import "server-only";

import type { Daya } from "@okeke-dev/daya-sdk";
import { cache } from "react";

import { createDayaClient } from "../client/index.js";
import type { DayaNextClientOptions } from "../types/config.js";

/**
 * Request-scoped {@link Daya} client for React Server Components.
 *
 * Wraps {@link createDayaClient} in React's `cache()`, so every Server
 * Component in a single request that calls this helper receives the **same**
 * client instance — the constructor (and its config resolution) runs exactly
 * once per request instead of once per component.
 *
 * Memoization is keyed on the `options` argument as React `cache` expects:
 * - no argument (or the same `options` object reference) → one shared client
 *   per request — the intended usage, e.g. a module-level export:
 *
 *   ```ts
 *   // lib/daya.ts
 *   import { createDayaCachedClient } from "@okeke-dev/daya-next";
 *   export const getDaya = createDayaCachedClient;
 *   ```
 *
 * - a brand-new `options` object on every call → a fresh client each time
 *   (React keyes object arguments by reference).
 *
 * The cache is scoped to the current request. React `cache` memoizes anywhere
 * Next.js has the request-scope store enabled — Server Component renders and
 * Server Actions (which run inside that scope). **Do not** use this helper in
 * plain Node-runtime Route Handlers or Middleware: outside the request scope
 * there is no memoization store, so `cache()` re-runs the factory on every call
 * (and a long-lived process could still share one client across requests). For
 * Node-runtime handlers, use {@link createDayaClient} directly.
 *
 * `cache` is imported from `react` (the officially documented RSC
 * memoization primitive) — the `next/cache` module never exported `cache`.
 * `react` is therefore a peer dependency, like `next`. This entry is
 * server-only, like {@link createDayaClient}.
 */
export function createDayaCachedClient(options?: DayaNextClientOptions): Daya {
  return cachedCreate(options);
}

/**
 * Async convenience mirror of {@link createDayaCachedClient}, sharing the same
 * request-scoped cache key as the synchronous form.
 */
export async function getDayaCachedClient(options?: DayaNextClientOptions): Promise<Daya> {
  return cachedCreate(options);
}

const cachedCreate = cache(createDayaClient);
