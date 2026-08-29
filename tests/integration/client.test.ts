import { describe, expect, it, vi } from "vitest";

import { DayaAuthenticationError } from "@okeke-dev/daya-sdk";

import { createDayaClient } from "../../src/client/index.js";

describe("integration: createDayaClient over a mocked fetch", () => {
  it("maps a 401 API response to DayaAuthenticationError", async () => {
    const fetchMock = vi.fn<typeof fetch>(async (_input, _init) => {
      return new Response(
        JSON.stringify({ error: { code: "unauthorized", message: "Invalid or missing API key" } }),
        { status: 401, headers: { "content-type": "application/json" } },
      );
    });

    const client = createDayaClient({
      apiKey: "sk_sandbox_test",
      baseUrl: "https://daya.test",
      fetch: fetchMock,
    });

    await expect(client.raw<unknown>("GET", "/v0/ping")).rejects.toBeInstanceOf(
      DayaAuthenticationError,
    );
  });

  it("returns parsed JSON on success without retrying", async () => {
    const fetchMock = vi.fn<typeof fetch>(async (_input, _init) => {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    });

    const client = createDayaClient({
      apiKey: "sk_sandbox_test",
      baseUrl: "https://daya.test",
      fetch: fetchMock,
    });

    const body = await client.raw<{ ok: boolean }>("GET", "/v0/ping");

    expect(body).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://daya.test/v0/ping");
    const headers = new Headers(init.headers);
    expect(headers.get("x-api-key")).toBe("sk_sandbox_test");
  });
});
