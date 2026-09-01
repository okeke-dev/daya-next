import { describe, expect, it, vi } from "vitest";

import {
  Daya,
  DayaApiError,
  DayaAuthenticationError,
  DayaNetworkError,
  DayaRateLimitError,
  DayaTimeoutError,
  DayaValidationError,
} from "@okeke-dev/daya-sdk";

import { createDayaRouteHandler } from "../../src/route-handler/index.js";

const ROUTE_URL = "https://example.com/api/transfers";

async function invoke(
  handler: Parameters<typeof createDayaRouteHandler>[0],
  options?: { client?: unknown },
  context?: { params: Record<string, string> },
) {
  const route = createDayaRouteHandler(
    handler,
    options as Parameters<typeof createDayaRouteHandler>[1],
  );
  // Next.js 15.5 passes route params as a Promise (async params); so does this
  // test invocation.
  const resolvedContext: { params: Promise<Record<string, string>> } = {
    params: Promise.resolve(context?.params ?? {}),
  };
  return route(new Request(ROUTE_URL, { method: "POST", body: "{}" }), resolvedContext);
}

async function body(response: Response): Promise<Record<string, unknown>> {
  return (await response.json()) as Record<string, unknown>;
}

describe("createDayaRouteHandler", () => {
  it("returns the handler's Response on success", async () => {
    const response = await invoke(async () => Response.json({ ok: true }, { status: 201 }));
    expect(response.status).toBe(201);
    expect(await body(response)).toEqual({ ok: true });
  });

  it("passes the request through", async () => {
    const response = await invoke(async ({ request }) => Response.json({ method: request.method }));
    expect(await body(response)).toEqual({ method: "POST" });
  });

  it("passes dynamic route params through", async () => {
    const response = await invoke(
      async ({ params }) => Response.json({ id: (await params).id }),
      undefined,
      { params: { id: "trf_123" } },
    );
    expect(await body(response)).toEqual({ id: "trf_123" });
  });

  it("hands the handler a daya client built from explicit client options", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => {
      return new Response(JSON.stringify({ transfer: { id: "trf_1" } }), { status: 200 });
    });
    const response = await invoke(
      async ({ daya }) =>
        Response.json(await daya.raw<{ transfer: { id: string } }>("GET", "/v1/transfers")),
      { client: { apiKey: "sk_sandbox_test", baseUrl: "https://daya.test", fetch: fetchMock } },
    );

    expect(response.status).toBe(200);
    expect(await body(response)).toEqual({ transfer: { id: "trf_1" } });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("accepts an already-constructed Daya instance", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => {
      return new Response(JSON.stringify({ ping: "pong" }), { status: 200 });
    });
    const daya = new Daya({
      apiKey: "sk_sandbox_test",
      baseUrl: "https://daya.test",
      fetch: fetchMock,
    });

    const response = await invoke(
      async ({ daya: client }) =>
        Response.json(await client.raw<{ ping: string }>("GET", "/v0/ping")),
      { client: daya },
    );

    expect(response.status).toBe(200);
    expect(await body(response)).toEqual({ ping: "pong" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("dayaApiErrorToResponse: SDK error mapping", () => {
  it("maps DayaAuthenticationError to 401, preserving message, code, and requestId", async () => {
    const response = await invoke(async () => {
      throw new DayaAuthenticationError("Invalid or missing API key", { requestId: "req_401" });
    });

    expect(response.status).toBe(401);
    expect(await body(response)).toEqual({
      error: "Invalid or missing API key",
      code: "unauthorized",
      requestId: "req_401",
    });
    expect(response.headers.get("x-request-id")).toBe("req_401");
  });

  it("maps DayaValidationError to 400 with details and validation", async () => {
    const response = await invoke(async () => {
      throw new DayaValidationError("Validation failed", {
        requestId: "req_400",
        details: "amount must be a positive decimal string",
        validation: "amount",
      });
    });

    expect(response.status).toBe(400);
    expect(await body(response)).toMatchObject({
      error: "Validation failed",
      code: "VALIDATION_FAILED",
      details: "amount must be a positive decimal string",
      validation: "amount",
      requestId: "req_400",
    });
  });

  it("maps DayaRateLimitError to 429", async () => {
    const response = await invoke(async () => {
      throw new DayaRateLimitError("Rate limit exceeded", { requestId: "req_429" });
    });
    expect(response.status).toBe(429);
    expect(await body(response)).toMatchObject({ code: "RATE_LIMITED", requestId: "req_429" });
  });

  it("maps DayaTimeoutError to 504 Gateway Timeout", async () => {
    const response = await invoke(async () => {
      throw new DayaTimeoutError("Request timed out");
    });
    expect(response.status).toBe(504);
    expect(await body(response)).toMatchObject({ code: "TIMEOUT" });
  });

  it("maps DayaNetworkError to 502 Bad Gateway", async () => {
    const response = await invoke(async () => {
      throw new DayaNetworkError("fetch failed", { endpoint: "/v1/transfers" });
    });
    expect(response.status).toBe(502);
    expect(await body(response)).toMatchObject({ code: "NETWORK_ERROR" });
  });

  it("preserves the status code and code of a generic DayaApiError", async () => {
    const response = await invoke(async () => {
      throw new DayaApiError("Balance unavailable", {
        code: "BALANCE_UNAVAILABLE",
        statusCode: 503,
        requestId: "req_503",
      });
    });
    expect(response.status).toBe(503);
    expect(await body(response)).toMatchObject({ code: "BALANCE_UNAVAILABLE" });
    expect(response.headers.get("x-request-id")).toBe("req_503");
  });

  it("sanitizes unexpected errors to a generic 500", async () => {
    const response = await invoke(async () => {
      throw new Error("secret internals: apiKey=sk_live_hunter2");
    });

    expect(response.status).toBe(500);
    const result = await body(response);
    expect(result).toEqual({ error: "Internal server error", code: "INTERNAL_ERROR" });
    expect(JSON.stringify(result)).not.toContain("sk_live");
    expect(response.headers.get("x-request-id")).toBeNull();
  });
});
