import "server-only";

import { DayaWebhookError } from "@okeke-dev/daya-sdk";
import type { WebhookEvent } from "@okeke-dev/daya-sdk";

import type { DayaWebhookRouteOptions } from "../types/config.js";
import { verifyDayaWebhook } from "../webhooks/index.js";

/**
 * Map an error to a webhook HTTP response.
 *
 * - `DayaWebhookError` → `401` (failed signature verification) or `400`
 *   (unparseable / malformed payload).
 * - Anything else → `500`.
 */
export function dayaErrorToResponse(error: unknown): Response {
  if (error instanceof DayaWebhookError) {
    const isVerificationFailure =
      error.reason === "invalid_signature" || error.reason === "malformed_header";
    return Response.json(
      { error: error.message, code: error.code, reason: error.reason },
      { status: isVerificationFailure ? 401 : 400 },
    );
  }
  return Response.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 });
}

/**
 * Build an App Router webhook Route Handler.
 *
 * @example
 * ```ts
 * // app/api/webhooks/daya/route.ts
 * export const { POST } = createDayaWebhookRoute({
 *   handlers: [createWebhookHandler("deposit.completed", (event) => {})],
 * });
 * ```
 */
export function createDayaWebhookRoute(options: DayaWebhookRouteOptions): {
  POST: (request: Request) => Promise<Response>;
} {
  const { handlers, secret, isProcessed, markProcessed, onEvent } = options;

  async function POST(request: Request): Promise<Response> {
    let event: WebhookEvent;
    try {
      const verified = await verifyDayaWebhook(request, { secret });
      event = verified.event;
    } catch (error) {
      return dayaErrorToResponse(error);
    }

    if (isProcessed && (await isProcessed(event.id))) {
      return Response.json({ status: "ok", duplicate: true });
    }

    await dispatch(handlers, event);
    if (onEvent) await onEvent(event);
    if (markProcessed) await markProcessed(event.id);

    return Response.json({ status: "ok" });
  }

  return { POST };
}

async function dispatch(
  handlers: readonly DayaWebhookRouteOptions["handlers"],
  event: WebhookEvent,
): Promise<void> {
  for (const handler of handlers) {
    if (handler.eventName === event.event) {
      await handler.handle(event as WebhookEvent & { event: typeof handler.eventName });
    }
  }
}
