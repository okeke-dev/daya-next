import Link from "next/link";

// A statically-rendered home page. It does NOT touch the Daya client, so it
// works even before you configure DAYA_API_KEY. All Daya calls happen in
// Server Actions, Route Handlers, and the webhook — never in the browser.

export default function HomePage() {
  return (
    <main>
      <h1>daya-next basic example</h1>
      <p>
        A deliberately small App Router app wiring <code>@okeke-dev/daya-next</code> to the{" "}
        <code>@okeke-dev/daya-sdk</code>. Daya credentials stay on the server: every client-next API
        surface used here is server-only.
      </p>

      <h2>Operations</h2>
      <ul>
        <li>
          <Link href="/customers/new">Create a customer</Link> — Server Action →
          <code>daya.customers.create</code>
        </li>
        <li>
          <Link href="/funding/new">Create a funding account</Link> — Server Action →{" "}
          <code>daya.fundingAccounts.create</code>
        </li>
        <li>
          <code>POST /api/transfers</code> — Route Handler → <code>daya.transfers.create</code>
        </li>
        <li>
          <code>POST /api/daya/webhook</code> — webhook receiver (verify signature + dispatch)
        </li>
        <li>
          <Link href="/status">Webhook-derived status</Link> — read safely as a Server Component
        </li>
      </ul>

      <p>See the README for setup, sandbox usage, and webhook configuration.</p>
    </main>
  );
}
