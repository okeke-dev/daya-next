import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Daya } from "@okeke-dev/daya-sdk";

import { createDayaCachedClient } from "../../src/cache/index.js";
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

/**
 * `createDayaCachedClient` wraps the client factory in React's `cache()`, which
 * memoizes **only inside a Next.js App Router Server Component render** (Next
 * enables React's request-memoization store there). Outside such a render — a
 * plain Node/vitest process, or even `react-dom/server` `renderToStaticMarkup` —
 * React's `cache` silently runs the wrapped function every call. The same-
 * instance sharing is therefore not asserted here; it is exercised by the
 * example app under a real Next build (CI `example-build` job). These tests
 * cover the behaviour that holds regardless of render scope: configuration and
 * environment resolution at call time, and that the plain (uncached) factory is
 * intentionally never memoized.
 */
describe("createDayaCachedClient", () => {
  it("returns a Daya client instance", () => {
    process.env.DAYA_API_KEY = "sk_sandbox_test";
    const daya = createDayaCachedClient();
    expect(daya).toBeInstanceOf(Daya);
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
