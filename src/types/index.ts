export * from "./config.js";
export * from "./env.js";

// Framework-agnostic SDK types re-exported for single-import DX. This module is
// type-only (`export type`), so these re-exports are erased at build time —
// importing just the *types* never loads SDK runtime code and never pulls a
// `server-only` guard, so type-only imports are safe anywhere, including client
// bundles. A **value** import of the root `@okeke-dev/daya-next` entry is
// different: it also exposes server-only client helpers and fails client builds
// (intended). Use the `/server` subpath for runtime imports and `import type`
// for the re-exported SDK types.
export type {
  Daya,
  DayaClientConfig,
  DayaError,
  DayaApiError,
  DayaAuthenticationError,
  DayaValidationError,
  DayaRateLimitError,
  DayaNetworkError,
  DayaTimeoutError,
  DayaWebhookError,
  WebhookVerificationFailureReason,
  WebhookEvent,
  WebhookEnvelope,
  DayaEventName,
  FundingAccountEventName,
  DepositEventName,
  TransferEventName,
  WithdrawalEventName,
  CustomerVerificationEventName,
  BankAccountVerificationEventName,
} from "@okeke-dev/daya-sdk";
