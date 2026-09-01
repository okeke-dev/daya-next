"use server";

import { DayaApiError, DayaValidationError } from "@okeke-dev/daya-sdk";

import { getDaya } from "@/lib/daya";

// Server Actions: mutate Daya resources from the server. These functions never
// expose the API key to the browser — they run in the Node runtime and only
// return plain, safe result objects. They use the `(prevState, formData)`
// signature expected by `useActionState`.

export interface ActionResult {
  ok: boolean;
  id?: string;
  message: string;
  details?: string;
}

/** Map a Daya SDK / network error to a safe user-facing message. */
function toResult(error: unknown): ActionResult {
  if (error instanceof DayaValidationError) {
    return {
      ok: false,
      message: "Invalid request.",
      details: error.message,
    };
  }
  if (error instanceof DayaApiError) {
    return {
      ok: false,
      message: "Daya API error.",
      details: error.message,
    };
  }
  return { ok: false, message: "Something went wrong." };
}

/** Create a Daya customer (an individual, for sandbox testing). */
export async function createCustomer(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const daya = getDaya();
    const first_name = String(formData.get("first_name") ?? "").trim();
    const last_name = String(formData.get("last_name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();

    if (!email || !first_name) {
      return { ok: false, message: "Email and first name are required." };
    }

    const { customer } = await daya.customers.create({ email, first_name, last_name });
    return {
      ok: true,
      id: customer.id,
      message: `Customer created: ${customer.id}`,
    };
  } catch (error) {
    return toResult(error);
  }
}

/**
 * Create a permanent NGN virtual-account funding account so a customer can send
 * funds into your platform. Demonstrates the funding-account operation.
 */
export async function createFundingAccount(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const daya = getDaya();
    const customer_id = String(formData.get("customer_id") ?? "").trim();

    if (!customer_id) {
      return { ok: false, message: "A customer id is required." };
    }

    const { funding_account } = await daya.fundingAccounts.create({
      customer_id,
      rail: "NGN_VIRTUAL_ACCOUNT",
      settlement_destination: { type: "INTERNAL_BALANCE" },
    });

    return {
      ok: true,
      id: funding_account.id,
      message: `Funding account created: ${funding_account.id} (${funding_account.status})`,
    };
  } catch (error) {
    return toResult(error);
  }
}
