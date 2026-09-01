import "server-only";

// In-memory store of webhook-derived status used to demonstrate "display
// webhook-derived status safely".
//
// Only whitelisted, non-secret fields are kept: nothing here ever stores the
// raw webhook body, the signing secret, or an API key. In a real application
// you would persist this in a database/queue instead of module memory.
//
// This module is guarded with `server-only` so it can never be bundled into a
// Client Component — the status string rendered by `app/status/page.tsx` (a
// Server Component) is the only thing that crosses the network.
interface StoredStatus {
  eventId: string;
  event: string;
  status: string;
  amount?: string;
  reference?: string;
  receivedAt: number;
}

const statuses = new Map<string, StoredStatus>();

/** Record the latest status for an event id. Server-action/webhook side. */
export function recordStatus(entry: StoredStatus): void {
  statuses.set(entry.eventId, entry);
}

/** Read the most recent webhook-derived status. Server-Component side. */
export function listStatuses(): StoredStatus[] {
  return Array.from(statuses.values())
    .sort((a, b) => a.receivedAt - b.receivedAt)
    .slice(-20);
}
