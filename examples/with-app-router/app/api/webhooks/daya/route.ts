import { createWebhookHandler } from "@okeke-dev/daya-sdk";
import { createDayaWebhookRoute } from "@okeke-dev/daya-next/server";

export const runtime = "nodejs";

export const { POST } = createDayaWebhookRoute({
  handlers: [
    createWebhookHandler("deposit.completed", async (event) => {
      console.log("Deposit completed:", event.id, event.data);
    }),
    createWebhookHandler("transfer.completed", async (event) => {
      console.log("Transfer completed:", event.id, event.data);
    }),
  ],
});
