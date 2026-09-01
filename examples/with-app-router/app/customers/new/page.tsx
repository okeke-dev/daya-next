"use client";

import { useActionState } from "react";

import { createCustomer, type CreateCustomerResult } from "@/app/actions/customers";

export default function NewCustomerPage() {
  const [state, formAction, isPending] = useActionState<CreateCustomerResult | null, FormData>(
    createCustomer,
    null,
  );

  return (
    <main>
      <h1>Create a customer</h1>
      <form action={formAction}>
        <label>
          Email
          <input name="email" type="email" required />
        </label>
        <button type="submit" disabled={isPending}>
          {isPending ? "Creating…" : "Create customer"}
        </button>
      </form>
      {state?.ok && <p>Created customer {state.customerId}.</p>}
      {state && !state.ok && <p role="alert">{state.error.message}</p>}
      <p>
        This is a Server Action backed by <code>createDayaClient()</code> — no Daya credentials ever
        reach the browser.
      </p>
    </main>
  );
}
