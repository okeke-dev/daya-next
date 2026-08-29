import { describe, expect, it } from "vitest";

import { DayaWebhookError } from "@okeke-dev/daya-sdk";

import { DayaNextConfigError } from "../../src/internal/errors.js";
import { verifyDayaWebhook } from "../../src/webhooks/index.js";
import {
  makeSignedRequest,
  makeSignedRequestFromRaw,
  makeWebhookPayload,
} from "../helpers/webhooks.js";

const SECRET = "whsec_test";

async function getWebhookError(promise: Promise<unknown>): Promise<DayaWebhookError> {
  const error = await promise.then(
    () => null,
    (cause) => cause,
  );
  expect(error).toBeInstanceOf(DayaWebhookError);
  return error as DayaWebhookError;
}

describe("verifyDayaWebhook", () => {
  it("returns the verified event and the exact raw body", async () => {
    const rawBody =
      '{"event":"deposit.completed","id":"evt_01H","data":{"id":"dep_01H"},"timestamp":"2025-05-01T00:00:00.000Z"}';
    const { event, rawBody: returnedRaw } = await verifyDayaWebhook(
      makeSignedRequestFromRaw(rawBody, SECRET),
      { secret: SECRET },
    );

    expect(event.event).toBe("deposit.completed");
    expect(event.id).toBe("evt_01H");
    expect(returnedRaw).toBe(rawBody);
  });

  it("uses the configured signature header", async () => {
    const request = makeSignedRequest(makeWebhookPayload(), SECRET, {
      signatureHeader: "x-custom-signature",
    });
    const { event } = await verifyDayaWebhook(request, {
      secret: SECRET,
      signatureHeader: "x-custom-signature",
    });
    expect(event.id).toBe("evt_01H");
  });

  it("rejects a tampered body with reason invalid_signature", async () => {
    const payload = makeWebhookPayload();
    const rawBody = JSON.stringify(payload);
    const request = makeSignedRequestFromRaw(rawBody, SECRET);
    // Tamper after signing: replace the id before sending.
    const tampered = JSON.stringify({ ...payload, id: "evt_TAMPERED" });
    const tamperedRequest = new Request(request, { body: tampered });

    const error = await getWebhookError(verifyDayaWebhook(tamperedRequest, { secret: SECRET }));
    expect(error.reason).toBe("invalid_signature");
  });

  it("rejects a signature computed with the wrong secret", async () => {
    const request = makeSignedRequest(makeWebhookPayload(), "whsec_wrong");
    const error = await getWebhookError(verifyDayaWebhook(request, { secret: SECRET }));
    expect(error.reason).toBe("invalid_signature");
  });

  it("rejects a missing signature header with reason malformed_header", async () => {
    const request = new Request("https://example.com/api/webhooks/daya", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(makeWebhookPayload()),
    });
    const error = await getWebhookError(verifyDayaWebhook(request, { secret: SECRET }));
    expect(error.reason).toBe("malformed_header");
  });

  it("falls back to DAYA_WEBHOOK_SECRET from the environment", async () => {
    process.env.DAYA_WEBHOOK_SECRET = SECRET;
    try {
      const rawBody = JSON.stringify(makeWebhookPayload());
      const { event } = await verifyDayaWebhook(makeSignedRequestFromRaw(rawBody, SECRET));
      expect(event.id).toBe("evt_01H");
    } finally {
      delete process.env.DAYA_WEBHOOK_SECRET;
    }
  });

  it("throws DayaNextConfigError when no secret is resolvable", async () => {
    delete process.env.DAYA_WEBHOOK_SECRET;
    const request = new Request("https://example.com/api/webhooks/daya", {
      method: "POST",
      body: JSON.stringify(makeWebhookPayload()),
    });
    await expect(verifyDayaWebhook(request)).rejects.toBeInstanceOf(DayaNextConfigError);
  });

  it("propagates a signature verify error without double-wrapping (name check)", async () => {
    const request = makeSignedRequest(makeWebhookPayload(), SECRET);
    const requestWithoutHeader = new Request(request);
    requestWithoutHeader.headers.delete("x-daya-signature");
    const error = await getWebhookError(
      verifyDayaWebhook(requestWithoutHeader, { secret: SECRET }),
    );
    expect(error.name).toBe("DayaWebhookError");
  });
});
