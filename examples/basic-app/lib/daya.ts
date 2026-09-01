import { createDayaCachedClient } from "@okeke-dev/daya-next";

// Server-side Daya client for React Server Components.
//
// `createDayaCachedClient` is:
//   - server-only (importing it from a Client Component fails the build, so the
//     API key can never reach the browser);
//   - memoized per HTTP request with React's `cache()`, so every Server
//     Component in one render shares the same `Daya` instance (the constructor
//     and env resolution run once per request);
//   - configured from `DAYA_API_KEY` / `DAYA_ENVIRONMENT` / `DAYA_BASE_URL` at
//     call time (never at module scope).
//
// Call it only from Server Components, Server Actions, or Route Handlers. Do
// not use it in Node-runtime Route Handlers where no RSC render exists.
export const getDaya = createDayaCachedClient;
