"use server";

import { revalidatePath } from "next/cache";
import { createDayaClient } from "@okeke-dev/daya-next";
import { DayaNetworkError, DayaValidationError } from "@okeke-dev/daya-sdk";

export type CreateCustomerResult =
  { ok: true; customerId: string } | { ok: false; error: { code: string; message: string } };

export async function createCustomer(
  _prevState: CreateCustomerResult | null,
  formData: FormData,
): Promise<CreateCustomerResult> {
  const email = String(formData.get("email") ?? "").trim();

  try {
    const daya = createDayaClient();
    const { customer } = await daya.customers.create({ email });
    revalidatePath("/customers/new");
    return { ok: true, customerId: customer.id };
  } catch (error) {
    if (error instanceof DayaValidationError) {
      return {
        ok: false,
        error: { code: error.code, message: "That email address could not be used." },
      };
    }
    if (error instanceof DayaNetworkError) {
      return {
        ok: false,
        error: { code: error.code, message: "Please try again in a moment." },
      };
    }
    return { ok: false, error: { code: "INTERNAL_ERROR", message: "Something went wrong." } };
  }
}
