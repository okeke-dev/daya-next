import { createWebhookHandler, isDepositEvent, isTransferEvent } from "@okeke-dev/daya-sdk";
import { createDayaWebhookRoute } from "@okeke-dev/daya-next/server";

import { recordStatus } from "@/lib/webhook-status";

// Webhook receiver for Daya events. `createDayaWebhookRoute` (from the
// `/server` subpath):
//   - reads `DAYA_WEBHOOK_SECRET` from the environment (never exposed to the
//     client);
//   - verifies the `x-daya-signature` HMAC over the raw body (delegating
//     cryptography to the SDK's `constructEvent` — no re-implementation here);
//   - dispatches each event to the matching `createWebhookHandler` from the
//     SDK;
//   - returns 401 on a bad signature and 200 on a good one, so Daya retries
//     only genuine failures.
//
// The default App Router runtime is Node.js, which is what the webhook helper
// requires (node:crypto). Do not switch this route to `edge`.

export const runtime = "nodejs";

export const { POST } = createDayaWebhookRoute({
  handlers: [
    createWebhookHandler("deposit.completed", async (event) => {
      const amount = event.data.type === "NGN_DEPOSIT" ? event.data.amount : undefined;
      recordStatus({
        eventId: event.id,
        event: event.event,
        status: "DEPOSIT_COMPLETED",
        amount,
        receivedAt: Date.now(),
      });
    }),
    createWebhookHandler("transfer.completed", async (event) => {
      recordStatus({
        eventId: event.id,
        event: event.event,
        status: "TRANSFER_COMPLETED",
        amount: event.data.amount,
        reference: event.data.reference,
        receivedAt: Date.now(),
      });
    }),
  ],
  onEvent: async (event) => {
    // Demonstrates raw-typed access to any verified event. Only whitelisted
    // fields are stored/returned; never log the raw body or secrets.
    if (isDepositEvent(event)) {
      console.log("deposit webhook received:", event.event, event.id);
    } else if (isTransferEvent(event)) {
      console.log("transfer webhook received:", event.event, event.id);
    }
  },
});
