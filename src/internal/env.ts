import "server-only";

import { DAYA_ENV_VARS } from "../types/env.js";
import { DayaNextConfigError } from "./errors.js";

type ProcessEnv = Record<string, string | undefined>;

function nonEmpty(value: string | undefined): string | undefined {
  if (value !== undefined && value.trim().length > 0) return value;
  return undefined;
}

function missingMessage(envVar: string, optionName: string): string {
  return `Missing Daya configuration: set the "${envVar}" environment variable or pass "${optionName}" explicitly.`;
}

/** Resolve the Daya API key from an explicit option, falling back to the environment. */
export function resolveApiKey(processEnv: ProcessEnv, explicit?: string): string {
  const value = nonEmpty(explicit) ?? nonEmpty(processEnv[DAYA_ENV_VARS.apiKey]);
  if (value === undefined) {
    throw new DayaNextConfigError(missingMessage(DAYA_ENV_VARS.apiKey, "apiKey"));
  }
  return value;
}

/** Resolve the webhook signing secret from an explicit option, falling back to the environment. */
export function resolveWebhookSecret(processEnv: ProcessEnv, explicit?: string): string {
  const value = nonEmpty(explicit) ?? nonEmpty(processEnv[DAYA_ENV_VARS.webhookSecret]);
  if (value === undefined) {
    throw new DayaNextConfigError(missingMessage(DAYA_ENV_VARS.webhookSecret, "secret"));
  }
  return value;
}

/** Resolve the optional environment, validating `sandbox` / `production` values. */
export function resolveOptionalEnvironment(
  processEnv: ProcessEnv,
  explicit?: "sandbox" | "production",
): "sandbox" | "production" | undefined {
  const value = explicit ?? processEnv[DAYA_ENV_VARS.environment];
  if (value === undefined || value === "") return undefined;
  if (value !== "sandbox" && value !== "production") {
    throw new DayaNextConfigError(
      `Invalid "${DAYA_ENV_VARS.environment}" value "${value}": expected "sandbox" or "production".`,
    );
  }
  return value;
}

/** Resolve the optional base URL override. */
export function resolveOptionalBaseUrl(
  processEnv: ProcessEnv,
  explicit?: string,
): string | undefined {
  return nonEmpty(explicit) ?? nonEmpty(processEnv[DAYA_ENV_VARS.baseUrl]);
}
