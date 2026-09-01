import type { Metadata } from "next";

import NewFundingForm from "./form";

export const metadata: Metadata = { title: "New funding account" };

export default function NewFundingPage() {
  return (
    <main>
      <h1>Create a funding account</h1>
      <p>
        Submits to the <code>createFundingAccount</code> Server Action, which calls{" "}
        <code>daya.fundingAccounts.create</code> to provision an NGN virtual account a customer can
        deposit into.
      </p>
      <NewFundingForm />
    </main>
  );
}
