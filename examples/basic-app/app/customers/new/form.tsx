"use client";

import { createCustomer, type ActionResult } from "@/app/actions/daya";
import { useActionState } from "react";

const initialState: ActionResult = { ok: false, message: "" };

// Client Component: renders the form and runs the server-side createCustomer
// action. Only the returned ActionResult crosses to the browser — never the
// Daya API key or the client.
export default function NewCustomerForm() {
  const [state, formAction, pending] = useActionState(createCustomer, initialState);

  return (
    <form action={formAction} style={{ display: "grid", gap: "0.5rem", maxWidth: "360px" }}>
      <label>
        First name <input name="first_name" required />
      </label>
      <label>
        Last name <input name="last_name" />
      </label>
      <label>
        Email <input name="email" type="email" required />
      </label>
      <button disabled={pending}>{pending ? "Creating…" : "Create customer"}</button>
      {state.message && (
        <p style={{ color: state.ok ? "green" : "red" }}>
          {state.message}
          {state.details ? ` (${state.details})` : ""}
        </p>
      )}
    </form>
  );
}
