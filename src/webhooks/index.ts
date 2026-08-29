import "server-only";

import { constructEvent } from "@okeke-dev/daya-sdk";
import type { WebhookEvent } from "@okeke-dev/daya-sdk";

import { resolveWebhookSecret } from "../internal/env.js";
import { DAYA_SIGNATURE_HEADER } from "../types/env.js";

/** Options for `verifyDayaWebhook`. */
export interface VerifyDayaWebhookOptions {
  /** Webhook signing secret. Defaults to `process.env.DAYA_WEBHOOK_SECRET`. */
  secret?: string;
  /** Header carrying the signature. Defaults to `x-daya-signature`. */
  signatureHeader?: string;
}

/** Result of a successful webhook verification. */
export interface VerifiedDayaWebhook {
  /** Signature-verified, typed webhook event. */
  event: WebhookEvent;
  /** The exact raw body the signature was computed over. */
  rawBody: string;
}

/**
 * Verify and parse a webhook request.
 *
 * Reads the raw body (`request.text()`) exactly once and delegates
 * cryptographic verification to the SDK's `constructEvent`. Never pass a
 * JSON-parsed or re-stringified body — `JSON.stringify` changes whitespace and
 * key ordering, which breaks the HMAC signature.
 *
 * @throws {DayaWebhookError} when verification or parsing fails.
 */
export async function verifyDayaWebhook(
  request: Request,
  options: VerifyDayaWebhookOptions = {},
): Promise<VerifiedDayaWebhook> {
  const secret = options.secret ?? resolveWebhookSecret(process.env);
  const signatureHeader = options.signatureHeader ?? DAYA_SIGNATURE_HEADER;

  const rawBody = await request.text();
  const signature = request.headers.get(signatureHeader) ?? "";
  const event = constructEvent(rawBody, signature, secret);

  return { event, rawBody };
}
