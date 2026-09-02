import { describe, expect, it, vi } from "vitest";

import { createWebhookHandler } from "@okeke-dev/daya-sdk";

import { createDayaWebhookRoute } from "../../src/webhook-route/index.js";
import {
  makeSignedRequest,
  makeSignedRequestFromRaw,
  makeWebhookPayload,
} from "../helpers/webhooks.js";

const SECRET = "whsec_test";

async function readBody(response: Response): Promise<Record<string, unknown>> {
  return (await response.json()) as Record<string, unknown>;
}

describe("createDayaWebhookRoute", () => {
  it("dispatches to matching handlers and returns 200", async () => {
    const handle = vi.fn(async (_event) => {});
    const onEvent = vi.fn(async () => {});
    const markProcessed = vi.fn(async () => {});
    const { POST } = createDayaWebhookRoute({
      secret: SECRET,
      handlers: [createWebhookHandler("deposit.completed", handle)],
      onEvent,
      markProcessed,
    });

    const response = await POST(makeSignedRequest(makeWebhookPayload(), SECRET));

    expect(response.status).toBe(200);
    expect(await readBody(response)).toEqual({ status: "ok" });
    expect(handle).toHaveBeenCalledTimes(1);
    expect(handle.mock.calls[0]?.[0]?.event).toBe("deposit.completed");
    expect(onEvent).toHaveBeenCalledTimes(1);
    expect(markProcessed).toHaveBeenCalledTimes(1);
  });

  it("returns 200 when no handler matches the event", async () => {
    const handle = vi.fn(async (_event) => {});
    const { POST } = createDayaWebhookRoute({
      secret: SECRET,
      handlers: [createWebhookHandler("transfer.completed", handle)],
    });

    const response = await POST(makeSignedRequest(makeWebhookPayload(), SECRET));

    expect(response.status).toBe(200);
    expect(handle).not.toHaveBeenCalled();
  });

  it("skips dispatch for an already-processed event", async () => {
    const handle = vi.fn(async (_event) => {});
    const markProcessed = vi.fn(async () => {});
    const { POST } = createDayaWebhookRoute({
      secret: SECRET,
      handlers: [createWebhookHandler("deposit.completed", handle)],
      isProcessed: async (eventId) => eventId === "evt_01H",
      markProcessed,
    });

    const response = await POST(makeSignedRequest(makeWebhookPayload(), SECRET));

    expect(response.status).toBe(200);
    expect(await readBody(response)).toEqual({ status: "ok", duplicate: true });
    expect(handle).not.toHaveBeenCalled();
    expect(markProcessed).not.toHaveBeenCalled();
  });

  it("returns 401 for an invalid signature", async () => {
    const handle = vi.fn(async (_event) => {});
    const { POST } = createDayaWebhookRoute({
      secret: SECRET,
      handlers: [createWebhookHandler("deposit.completed", handle)],
    });

    const request = new Request("https://example.com/api/webhooks/daya", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(makeWebhookPayload()),
    });
    const response = await POST(request);

    expect(response.status).toBe(401);
    expect(handle).not.toHaveBeenCalled();
    const body = await readBody(response);
    expect(body.code).toBe("WEBHOOK_VERIFICATION_FAILED");
  });

  it("returns 401 when the signature header is missing", async () => {
    const { POST } = createDayaWebhookRoute({
      secret: SECRET,
      handlers: [],
    });

    const request = new Request("https://example.com/api/webhooks/daya", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(makeWebhookPayload()),
    });
    const response = await POST(request);

    expect(response.status).toBe(401);
    const body = await readBody(response);
    expect(body.code).toBe("WEBHOOK_VERIFICATION_FAILED");
    expect(body.reason).toBe("malformed_header");
  });

  it("returns 400 when the signed body is not valid JSON", async () => {
    const { POST } = createDayaWebhookRoute({
      secret: SECRET,
      handlers: [],
    });

    const rawBody = "this-is-not-json";
    const response = await POST(makeSignedRequestFromRaw(rawBody, SECRET));

    expect(response.status).toBe(400);
  });

  it("returns 500 when a handler throws", async () => {
    const { POST } = createDayaWebhookRoute({
      secret: SECRET,
      handlers: [
        createWebhookHandler("deposit.completed", async () => {
          throw new Error("boom");
        }),
      ],
    });

    const response = await POST(makeSignedRequest(makeWebhookPayload(), SECRET));

    expect(response.status).toBe(500);
    const body = await readBody(response);
    expect(body.code).toBe("INTERNAL_ERROR");
  });

  it("awaits an asynchronous event handler before responding", async () => {
    const completed: string[] = [];
    const { POST } = createDayaWebhookRoute({
      secret: SECRET,
      handlers: [
        createWebhookHandler("deposit.completed", async () => {
          await new Promise((resolve) => setTimeout(resolve, 5));
          completed.push("handler-done");
        }),
      ],
    });

    const response = await POST(makeSignedRequest(makeWebhookPayload(), SECRET));

    expect(response.status).toBe(200);
    expect(completed).toEqual(["handler-done"]);
  });

  it("falls back to DAYA_WEBHOOK_SECRET from the environment", async () => {
    const handle = vi.fn(async (_event) => {});
    const { POST } = createDayaWebhookRoute({
      handlers: [createWebhookHandler("deposit.completed", handle)],
    });

    process.env.DAYA_WEBHOOK_SECRET = SECRET;
    try {
      const response = await POST(makeSignedRequest(makeWebhookPayload(), SECRET));
      expect(response.status).toBe(200);
    } finally {
      delete process.env.DAYA_WEBHOOK_SECRET;
    }
  });
});
