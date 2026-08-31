import { createDayaRouteHandler } from "@okeke-dev/daya-next";
import { DayaValidationError } from "@okeke-dev/daya-sdk";

// Default App Router runtime is Node.js. The plain API client and this route
// factory are Edge-compatible too, so `export const runtime = "edge"` works
// here IF you really need it — but the webhook route
// (`app/api/webhooks/daya/route.ts`) MUST stay on nodejs (node:crypto).
export const runtime = "nodejs";

const REQUIRED_FIELDS = ["amount", "currency", "reference", "recipient_id"] as const;

interface CreateTransferBody {
  currency: "NGN" | "USD";
  amount: string;
  reference: string;
  recipient_id?: string;
}

/**
 * POST /api/transfers
 *
 * Creates a transfer. Demonstrates:
 *  - zero-boilerplate Daya client wiring (createDayaRouteHandler)
 *  - validation surfaced as a typed 400 (DayaValidationError)
 *  - an explicit success status code (201) via Response.json
 *  - SDK errors auto-mapped to HTTP responses with the Daya request id
 *    preserved in the body and `x-request-id` header
 */
export const POST = createDayaRouteHandler(async ({ request, daya }) => {
  const body = (await request.json().catch(() => null)) as CreateTransferBody | null;

  if (!body || REQUIRED_FIELDS.some((field) => !body[field])) {
    throw new DayaValidationError(`Missing required fields: ${REQUIRED_FIELDS.join(", ")}`);
  }

  const { transfer } = await daya.transfers.create(body);

  return Response.json(transfer, { status: 201 });
});
