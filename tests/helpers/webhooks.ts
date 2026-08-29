import { generateSignature } from "@okeke-dev/daya-sdk";

/**
 * Build a `WebhookEvent`-shaped payload. `constructEvent` validates the
 * envelope fields (`event`, `id`, `data`, `timestamp`) only, so `data` is a
 * minimal object rather than a full deposit resource.
 */
export function makeWebhookPayload(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    event: "deposit.completed",
    id: "evt_01H",
    data: { id: "dep_01H" },
    timestamp: "2025-05-01T00:00:00.000Z",
    ...overrides,
  };
}

/** Create a `Request` whose body is `JSON.stringify(payload)` and sign it with `secret`. */
export function makeSignedRequest(
  payload: Record<string, unknown>,
  secret: string,
  opts: { signatureHeader?: string } = {},
): Request {
  return makeSignedRequestFromRaw(JSON.stringify(payload), secret, opts);
}

/** Create a `Request` from an exact raw body string, signing that exact string. */
export function makeSignedRequestFromRaw(
  rawBody: string,
  secret: string,
  opts: { signatureHeader?: string } = {},
): Request {
  const signature = generateSignature(rawBody, secret);
  const headers = new Headers({ "content-type": "application/json" });
  headers.set(opts.signatureHeader ?? "x-daya-signature", signature);
  return new Request("https://example.com/api/webhooks/daya", {
    method: "POST",
    headers,
    body: rawBody,
  });
}
