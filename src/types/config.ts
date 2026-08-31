import type { DayaClientConfig, DayaEventName, WebhookEvent } from "@okeke-dev/daya-sdk";

/**
 * Options for `createDayaClient` / `getDayaClient`.
 *
 * Every field is optional; values are resolved from environment variables at
 * call time when not provided explicitly. Explicit options always win.
 */
export type DayaNextClientOptions = Partial<DayaClientConfig>;

/**
 * Structural mirror of the SDK's `createWebhookHandler` return value.
 *
 * Kept decoupled so the route factory can accept handlers without
 * re-implementing the SDK's typed event dispatch.
 */
export interface DayaWebhookHandler<TEvent extends DayaEventName = DayaEventName> {
  readonly eventName: TEvent;
  // Declared as a method (not an arrow property) so that SDK handlers — whose
  // `handle` accepts the *narrowed* per-event type via method bivariance — are
  // structurally assignable to this interface.
  handle(event: WebhookEvent & { event: TEvent }): void | Promise<void>;
}

/** Options for `createDayaWebhookRoute`. */
export interface DayaWebhookRouteOptions {
  /** Webhook signing secret. Defaults to `process.env.DAYA_WEBHOOK_SECRET`. */
  secret?: string;
  /** Typed handlers created with the SDK's `createWebhookHandler`. */
  handlers: readonly DayaWebhookHandler[];
  /**
   * Return `true` when `eventId` has already been processed. Returning `true`
   * short-circuits to a `200` response without dispatching handlers.
   */
  isProcessed?: (eventId: string) => boolean | Promise<boolean>;
  /** Mark `eventId` as processed, called after successful handling. */
  markProcessed?: (eventId: string) => void | Promise<void>;
  /** Catch-all observer invoked for every verified event. */
  onEvent?: (event: WebhookEvent) => void | Promise<void>;
}
