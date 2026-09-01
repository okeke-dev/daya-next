import { createDayaRouteHandler } from "@okeke-dev/daya-next";
import { DayaValidationError } from "@okeke-dev/daya-sdk";

// Route Handler for POST /api/transfers using the daya-next factory. The
// factory builds the server-side client, maps Daya SDK errors to typed HTTP
// responses (!see `dayaApiErrorToResponse`), and sanitizes unexpected failures.

export const runtime = "nodejs";

const REQUIRED_FIELDS = ["reference", "amount", "currency", "recipient_id"] as const;

interface CreateTransferBody {
  currency: "NGN" | "USD";
  amount: string;
  reference: string;
  recipient_id?: string;
}

/**
 * POST /api/transfers
 *
 * Create a transfer. The recipient must already exist (created via the SDK,
 * e.g. `daya.recipients.create`). Returns the created transfer or a typed
 * 4xx/5xx error body with the Daya request id preserved.
 */
export const POST = createDayaRouteHandler(async ({ request, daya }) => {
  const body = (await request.json().catch(() => null)) as CreateTransferBody | null;

  if (!body || REQUIRED_FIELDS.some((field) => !body[field])) {
    throw new DayaValidationError(`Missing required fields: ${REQUIRED_FIELDS.join(", ")}`);
  }

  const { transfer } = await daya.transfers.create({
    currency: body.currency,
    amount: body.amount,
    reference: body.reference,
    recipient_id: body.recipient_id,
  });

  return Response.json(transfer, { status: 201 });
});
