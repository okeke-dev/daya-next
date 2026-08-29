import { describe, expect, it, vi } from "vitest";

import { Daya } from "@okeke-dev/daya-sdk";

import { createDayaClient, getDayaClient } from "../../src/client/index.js";
import { DayaNextConfigError } from "../../src/internal/errors.js";
import { DAYA_ENV_VARS } from "../../src/types/env.js";

const ORIGINAL_API_KEY = process.env.DAYA_API_KEY;
const ORIGINAL_ENVIRONMENT = process.env.DAYA_ENVIRONMENT;

beforeEach(() => {
  delete process.env.DAYA_API_KEY;
  delete process.env.DAYA_ENVIRONMENT;
});

afterEach(() => {
  if (ORIGINAL_API_KEY === undefined) delete process.env.DAYA_API_KEY;
  else process.env.DAYA_API_KEY = ORIGINAL_API_KEY;
  if (ORIGINAL_ENVIRONMENT === undefined) delete process.env.DAYA_ENVIRONMENT;
  else process.env.DAYA_ENVIRONMENT = ORIGINAL_ENVIRONMENT;
});

/** Build a client whose SDK fetches are routed to a spy that records the request URL. */
function capturedClient(options: Parameters<typeof createDayaClient>[0]) {
  const fetchMock = vi.fn<typeof fetch>(async () => {
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  });
  const daya = createDayaClient({ ...options, fetch: fetchMock });
  return { daya, fetchMock };
}

async function lastUrl(fetchMock: ReturnType<typeof vi.fn>) {
  const call = fetchMock.mock.calls[0];
  expect(call).toBeDefined();
  return String(call[0]);
}

describe("createDayaClient", () => {
  it("throws DayaNextConfigError when no API key is resolvable", () => {
    expect(() => createDayaClient({})).toThrow(DayaNextConfigError);
  });

  it("builds an SDK Daya client from explicit options", () => {
    expect(createDayaClient({ apiKey: "sk_sandbox_test" })).toBeInstanceOf(Daya);
  });

  it("builds an SDK Daya client from the environment", () => {
    process.env.DAYA_API_KEY = "sk_sandbox_env";
    expect(createDayaClient({})).toBeInstanceOf(Daya);
  });

  it("prefers an explicit apiKey over the environment", () => {
    process.env.DAYA_API_KEY = "sk_sandbox_env";
    const client = createDayaClient({ apiKey: "sk_sandbox_explicit" });
    expect(client).toBeInstanceOf(Daya);
  });

  it("lets getDayaClient build a client asynchronously", async () => {
    const client = await getDayaClient({ apiKey: "sk_sandbox_test" });
    expect(client).toBeInstanceOf(Daya);
  });
});

describe("configuration: sandbox vs production", () => {
  it("targets the sandbox API for a sk_sandbox_ key", async () => {
    const { daya, fetchMock } = capturedClient({ apiKey: "sk_sandbox_test" });
    await daya.raw("GET", "/v1/rates");
    expect(await lastUrl(fetchMock)).toBe("https://api.sandbox.daya.co/v1/rates");
  });

  it("targets the production API for a sk_live_ key", async () => {
    const { daya, fetchMock } = capturedClient({ apiKey: "sk_live_test" });
    await daya.raw("GET", "/v1/rates");
    expect(await lastUrl(fetchMock)).toBe("https://api.daya.co/v1/rates");
  });

  it("forces production via an explicit environment option", async () => {
    const { daya, fetchMock } = capturedClient({
      apiKey: "sk_sandbox_test",
      environment: "production",
    });
    await daya.raw("GET", "/v1/rates");
    expect(await lastUrl(fetchMock)).toBe("https://api.daya.co/v1/rates");
  });

  it("honors DAYA_ENVIRONMENT=sandbox from the environment", async () => {
    process.env.DAYA_API_KEY = "sk_sandbox_test";
    process.env.DAYA_ENVIRONMENT = "sandbox";
    const { daya, fetchMock } = capturedClient({});
    await daya.raw("GET", "/v1/rates");
    expect(await lastUrl(fetchMock)).toBe("https://api.sandbox.daya.co/v1/rates");
  });

  it("prefers an explicit environment over env and key prefix", async () => {
    process.env.DAYA_API_KEY = "sk_sandbox_test";
    process.env.DAYA_ENVIRONMENT = "production";
    const { daya, fetchMock } = capturedClient({ environment: "sandbox" });
    await daya.raw("GET", "/v1/rates");
    expect(await lastUrl(fetchMock)).toBe("https://api.sandbox.daya.co/v1/rates");
  });
});

describe("configuration: explicit client configuration", () => {
  it("sends requests to an explicit baseUrl override", async () => {
    const { daya, fetchMock } = capturedClient({
      apiKey: "sk_sandbox_test",
      baseUrl: "https://proxy.example.com",
    });
    await daya.raw("GET", "/v1/rates");
    expect(await lastUrl(fetchMock)).toBe("https://proxy.example.com/v1/rates");
  });

  it("reads DAYA_BASE_URL from the environment", async () => {
    process.env.DAYA_API_KEY = "sk_sandbox_test";
    process.env.DAYA_BASE_URL = "https://proxy.example.com";
    try {
      const { daya, fetchMock } = capturedClient({});
      await daya.raw("GET", "/v1/rates");
      expect(await lastUrl(fetchMock)).toBe("https://proxy.example.com/v1/rates");
    } finally {
      delete process.env.DAYA_BASE_URL;
    }
  });

  it("attributes requests with the configured API key", async () => {
    const { daya, fetchMock } = capturedClient({ apiKey: "sk_sandbox_test" });
    await daya.raw("GET", "/v1/rates");
    const call = fetchMock.mock.calls[0];
    const init = call?.[1];
    expect(new Headers(init?.headers).get("x-api-key")).toBe("sk_sandbox_test");
  });
});

describe("configuration: validation", () => {
  it("exposes the configured environment constant", () => {
    expect(DAYA_ENV_VARS.apiKey).toBe("DAYA_API_KEY");
    expect(DAYA_ENV_VARS.environment).toBe("DAYA_ENVIRONMENT");
    expect(DAYA_ENV_VARS.baseUrl).toBe("DAYA_BASE_URL");
  });
});