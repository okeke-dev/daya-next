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
export { createDayaClient, getDayaClient } from "./client/index.js";
