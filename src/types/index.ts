export * from "./config.js";
export * from "./env.js";

// Framework-agnostic SDK types re-exported for single-import DX. These are
// type-only: importing this entry never loads SDK runtime code, keeping the
// root `@okeke-dev/daya-next` entry safe to import anywhere (including client
// bundles, where nothing sensitive lives).
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
