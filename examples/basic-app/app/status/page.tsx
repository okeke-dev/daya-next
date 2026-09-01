import type { Metadata } from "next";

import { listStatuses } from "@/lib/webhook-status";

export const metadata: Metadata = { title: "Webhook status" };
export const dynamic = "force-dynamic";

// Server Component: reads the webhook-derived status store server-side and
// renders only whitelisted fields (event, status, amount, reference). The raw
// webhook body and all secrets live exclusively on the server.
export default function StatusPage() {
  const statuses = listStatuses();

  return (
    <main>
      <h1>Webhook-derived status</h1>
      <p>
        The most recent <code>deposit.completed</code> / <code>transfer.completed</code> events
        received on <code>/api/daya/webhook</code>. Displayed safely: only a few non-secret fields
        are rendered.
      </p>

      {statuses.length === 0 ? (
        <p>No webhook events received yet. See the README to send one.</p>
      ) : (
        <table style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>Event</th>
              <th>Status</th>
              <th>Amount</th>
              <th>Reference</th>
              <th>Received</th>
            </tr>
          </thead>
          <tbody>
            {statuses.map((s) => (
              <tr key={s.eventId}>
                <td>{s.event}</td>
                <td>{s.status}</td>
                <td>{s.amount ?? "—"}</td>
                <td>{s.reference ?? "—"}</td>
                <td>{new Date(s.receivedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
