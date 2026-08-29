import { describe, expect, it } from "vitest";

import {
  resolveApiKey,
  resolveOptionalBaseUrl,
  resolveOptionalEnvironment,
  resolveWebhookSecret,
} from "../../src/internal/env.js";
import { DayaNextConfigError } from "../../src/internal/errors.js";
import { DAYA_ENV_VARS } from "../../src/types/env.js";

describe("env resolution", () => {
  it("prefers an explicit API key over the environment", () => {
    expect(resolveApiKey({ [DAYA_ENV_VARS.apiKey]: "sk_sandbox_env" }, "sk_sandbox_explicit")).toBe(
      "sk_sandbox_explicit",
    );
  });

  it("reads the API key from the environment when not explicit", () => {
    expect(resolveApiKey({ [DAYA_ENV_VARS.apiKey]: "sk_sandbox_env" })).toBe("sk_sandbox_env");
  });

  it("throws DayaNextConfigError when the API key is missing", () => {
    expect(() => resolveApiKey({})).toThrow(DayaNextConfigError);
  });

  it("ignores blank/whitespace API keys", () => {
    expect(() => resolveApiKey({ [DAYA_ENV_VARS.apiKey]: "   " })).toThrow(DayaNextConfigError);
  });

  it("reads the webhook secret from the environment", () => {
    expect(resolveWebhookSecret({ [DAYA_ENV_VARS.webhookSecret]: "whsec_test" })).toBe(
      "whsec_test",
    );
  });

  it("throws DayaNextConfigError when the webhook secret is missing", () => {
    expect(() => resolveWebhookSecret({})).toThrow(DayaNextConfigError);
  });

  it("resolves an optional environment string", () => {
    expect(resolveOptionalEnvironment({ [DAYA_ENV_VARS.environment]: "sandbox" })).toBe("sandbox");
    expect(resolveOptionalEnvironment({ [DAYA_ENV_VARS.environment]: "production" })).toBe(
      "production",
    );
  });

  it("returns undefined when the environment is not set", () => {
    expect(resolveOptionalEnvironment({})).toBeUndefined();
  });

  it("throws for an invalid environment value", () => {
    expect(() => resolveOptionalEnvironment({ [DAYA_ENV_VARS.environment]: "staging" })).toThrow(
      DayaNextConfigError,
    );
  });

  it("resolves an optional base URL", () => {
    expect(resolveOptionalBaseUrl({ [DAYA_ENV_VARS.baseUrl]: "https://proxy.example.com" })).toBe(
      "https://proxy.example.com",
    );
    expect(resolveOptionalBaseUrl({})).toBeUndefined();
  });
});
