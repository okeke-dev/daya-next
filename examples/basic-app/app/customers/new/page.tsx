import type { Metadata } from "next";

import NewCustomerForm from "./form";

export const metadata: Metadata = { title: "New customer" };

export default function NewCustomerPage() {
  return (
    <main>
      <h1>Create a customer</h1>
      <p>
        Submits to the <code>createCustomer</code> Server Action, which calls{" "}
        <code>daya.customers.create</code> server-side.
      </p>
      <NewCustomerForm />
    </main>
  );
}
