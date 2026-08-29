/**
 * Environment variable names used by daya-next.
 *
 * These names are intentionally NOT prefixed with `NEXT_PUBLIC_`: they are
 * server-only secrets and must never reach the client bundle.
 */
export const DAYA_ENV_VARS = {
  /** Configured Daya API key (`sk_sandbox_...` or `sk_live_...`). */
  apiKey: "DAYA_API_KEY",
  /** Webhook signing secret used to verify `x-daya-signature` requests. */
  webhookSecret: "DAYA_WEBHOOK_SECRET",
  /** Optional explicit environment: `sandbox` or `production`. */
  environment: "DAYA_ENVIRONMENT",
  /** Optional base URL override (e.g. a proxy). */
  baseUrl: "DAYA_BASE_URL",
} as const;

/** HTTP header carrying the webhook signature (lower-cased, per `Headers` normalization). */
export const DAYA_SIGNATURE_HEADER = "x-daya-signature";
