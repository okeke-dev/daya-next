// Public API surface — import from "@okeke-dev/daya-next".
//
// This entry exposes the server-side Daya client helper and the public types.
// `createDayaClient` / `getDayaClient` read secrets from environment variables
// at call time (never at module scope) and are guarded by the `server-only`
// marker, so importing this entry from a Client Component fails at build time
// (intended). Use it only from Route Handlers, Server Components, or Server
// Actions. A convenience `/server` subpath re-exports the same facilities
// alongside webhook helpers.
export * from "./types/index.js";
// ---- Route Handler helpers (Edge-safe; see src/route-handler) ----
export { createDayaRouteHandler, dayaApiErrorToResponse } from "./route-handler/index.js";
export type {
  DayaErrorResponseBody,
  DayaRouteContext,
  DayaRouteHandler,
  DayaRouteHandlerOptions,
  DayaRouteParams,
} from "./route-handler/index.js";

export { createDayaClient, getDayaClient } from "./client/index.js";
// ---- Request-scoped client caching for React Server Components ----
export { createDayaCachedClient, getDayaCachedClient } from "./cache/index.js";
