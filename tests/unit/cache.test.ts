import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Daya } from "@okeke-dev/daya-sdk";

import { createDayaCachedClient, getDayaCachedClient } from "../../src/cache/index.js";
import { createDayaClient } from "../../src/client/index.js";

const ORIGINAL_API_KEY = process.env.DAYA_API_KEY;

beforeEach(() => {
  delete process.env.DAYA_API_KEY;
  delete process.env.DAYA_ENVIRONMENT;
});

afterEach(() => {
  if (ORIGINAL_API_KEY === undefined) delete process.env.DAYA_API_KEY;
  else process.env.DAYA_API_KEY = ORIGINAL_API_KEY;
  delete process.env.DAYA_ENVIRONMENT;
});

async function lastUrl(fetchMock: ReturnType<typeof vi.fn>) {
  const call = fetchMock.mock.calls[0];
  if (call === undefined) throw new Error("expected at least one mocked fetch call");
  return String(call[0]);
}

describe("createDayaCachedClient", () => {
  it("shares one instance for repeated no-argument calls", () => {
    process.env.DAYA_API_KEY = "sk_sandbox_test";
    const first = createDayaCachedClient();
    const second = createDayaCachedClient();
    expect(first).toBe(second);
    expect(first).toBeInstanceOf(Daya);
  });

  it("shares one instance across the sync and async forms", async () => {
    process.env.DAYA_API_KEY = "sk_sandbox_test";
    const sync = createDayaCachedClient();
    const async = await getDayaCachedClient();
    expect(async).toBe(sync);
  });

  it("reuses one instance when the same options object is passed", () => {
    const options = { apiKey: "sk_sandbox_test" };
    const first = createDayaCachedClient(options);
    const second = createDayaCachedClient(options);
    expect(first).toBe(second);
  });

  it("builds a fresh instance for a brand-new options object", () => {
    const first = createDayaCachedClient({ apiKey: "sk_sandbox_test" });
    const second = createDayaCachedClient({ apiKey: "sk_sandbox_test" });
    expect(first).not.toBe(second);
  });

  it("resolves explicit configuration through the cache", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => {
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });
    const options = { apiKey: "sk_sandbox_test", fetch: fetchMock };
    const daya = createDayaCachedClient(options);
    await daya.raw("GET", "/v1/rates");
    expect(await lastUrl(fetchMock)).toBe("https://api.sandbox.daya.co/v1/rates");
  });

  it("resolves the environment at call time through the cache", async () => {
    process.env.DAYA_API_KEY = "sk_live_test";
    const fetchMock = vi.fn<typeof fetch>(async () => {
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });
    const daya = createDayaCachedClient({ fetch: fetchMock });
    await daya.raw("GET", "/v1/rates");
    expect(await lastUrl(fetchMock)).toBe("https://api.daya.co/v1/rates");
  });

  it("does not cache the plain createDayaClient helper", () => {
    process.env.DAYA_API_KEY = "sk_sandbox_test";
    expect(createDayaClient()).not.toBe(createDayaClient());
  });
});
