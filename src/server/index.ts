import "server-only";

export { createDayaClient, getDayaClient } from "../client/index.js";
export { createDayaCachedClient, getDayaCachedClient } from "../cache/index.js";
export { createDayaRouteHandler, dayaApiErrorToResponse } from "../route-handler/index.js";
export type {
  DayaErrorResponseBody,
  DayaRouteContext,
  DayaRouteHandler,
  DayaRouteHandlerOptions,
  DayaRouteParams,
} from "../route-handler/index.js";
export { createDayaWebhookRoute, dayaErrorToResponse } from "../route-handlers/index.js";
export { verifyDayaWebhook } from "../webhooks/index.js";
export type { VerifyDayaWebhookOptions, VerifiedDayaWebhook } from "../webhooks/index.js";
export { DayaNextConfigError } from "../internal/errors.js";
export { DAYA_ENV_VARS, DAYA_SIGNATURE_HEADER } from "../types/env.js";
export type {
  DayaNextClientOptions,
  DayaWebhookHandler,
  DayaWebhookRouteOptions,
} from "../types/config.js";

// Re-exported SDK helpers provided for convenience — the SDK remains the
// single owner of this behavior (no re-implementation here).
export { createWebhookHandler } from "@okeke-dev/daya-sdk";
