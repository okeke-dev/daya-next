"use client";

import { createFundingAccount, type ActionResult } from "@/app/actions/daya";
import { useActionState } from "react";

const initialState: ActionResult = { ok: false, message: "" };

// Client Component that runs the server-side createFundingAccount action. Only
// the ActionResult (id + status) crosses to the browser.
export default function NewFundingForm() {
  const [state, formAction, pending] = useActionState(createFundingAccount, initialState);

  return (
    <form action={formAction} style={{ display: "grid", gap: "0.5rem", maxWidth: "360px" }}>
      <label>
        Customer id <input name="customer_id" required placeholder="cus_..." />
      </label>
      <button disabled={pending}>{pending ? "Creating…" : "Create funding account"}</button>
      {state.message && (
        <p style={{ color: state.ok ? "green" : "red" }}>
          {state.message}
          {state.details ? ` (${state.details})` : ""}
        </p>
      )}
    </form>
  );
}
