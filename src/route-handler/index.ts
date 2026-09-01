import "server-only";

import {
  Daya,
  DayaApiError,
  DayaNetworkError,
  DayaTimeoutError,
  DayaValidationError,
  type DayaError,
} from "@okeke-dev/daya-sdk";

import { createDayaClient } from "../client/index.js";
import type { DayaNextClientOptions } from "../types/config.js";

// ---------------------------------------------------------------------------
// Route Handler integration
//
// Keeps plain Next.js conventions (an async function receiving `Request` and
// the dynamic params) but removes the three lines of repetitive boilerplate
// every handler needs: build the client, map SDK errors to HTTP responses,
// and sanitize unexpected failures. Returns the standard Web `Response` API —
// `NextResponse` adds nothing for JSON APIs (see README, "Route Handlers &
// responses").
//
// Edge-compatible: this module and the client it hands out use only Web APIs
// (fetch, Response, AbortController). The webhook helpers — which need
// node:crypto — live separately behind the /server entry.
// ---------------------------------------------------------------------------

/** Dynamic route params as passed by the Next.js App Router. */
export type DayaRouteParams = Readonly<Record<string, string | string[] | undefined>>;

/** Context handed to a Route Handler created by `createDayaRouteHandler`. */
export interface DayaRouteContext<TParams = DayaRouteParams> {
  /** The incoming Request. */
  request: Request;
  /**
   * Dynamic-route params (the second Route Handler argument). In Next.js 15+
   * this is a `Promise` (async params); await it as needed. Binds to `{}` when
   * the route has no dynamic segment.
   */
  params: TParams | Promise<TParams>;
  /** A configured `Daya` client (see `DayaRouteHandlerOptions.client`). */
  daya: Daya;
}

/** Options for `createDayaRouteHandler`. */
export interface DayaRouteHandlerOptions {
  /**
   * Either explicit client options (resolved against the environment) or a
   * fully-constructed `Daya` instance to inject (useful for per-tenant keys,
   * mocks, and tests). Defaults to environment-resolved configuration.
   */
  client?: Daya | DayaNextClientOptions;
}

/** The handler signature: return any `Response` (e.g. `Response.json`). */
export type DayaRouteHandler<TParams = DayaRouteParams> = (
  context: DayaRouteContext<TParams>,
) => Response | Promise<Response>;

/** JSON body shape produced by `dayaApiErrorToResponse`. */
export interface DayaErrorResponseBody {
  error: string;
  code: string;
  details?: string;
  validation?: string;
  requestId?: string;
}

/**
 * Map an error thrown by a Daya client call to a Web `Response`.
 *
 * - `DayaAuthenticationError` → 401
 * - `DayaValidationError`     → 400 (incl. `details` / `validation`)
 * - `DayaRateLimitError`      → 429
 * - `DayaTimeoutError`        → 504 Gateway Timeout
 * - `DayaNetworkError`        → 502 Bad Gateway
 * - any other `DayaApiError`  → the API's own status code (or 500 fallback)
 * - anything else             → 500 with a sanitized body (no stack traces,
 *   no internal messages, no secrets)
 *
 * When the error carries a Daya `requestId`, it is returned both in the body
 * and the `x-request-id` response header for tracing.
 */
export function dayaApiErrorToResponse(error: unknown): Response {
  if (error instanceof DayaNetworkError) {
    return errorResponse(502, error);
  }
  if (error instanceof DayaTimeoutError) {
    return errorResponse(504, error);
  }
  if (error instanceof DayaApiError) {
    const status = error.statusCode >= 400 && error.statusCode < 600 ? error.statusCode : 500;
    return errorResponse(status, error);
  }
  return errorResponse(
    500,
    new DayaApiError("Internal server error", { code: "INTERNAL_ERROR", statusCode: 500 }),
  );
}

function errorResponse(status: number, error: DayaError): Response {
  const body: DayaErrorResponseBody = { error: error.message, code: error.code };
  if (error.requestId) body.requestId = error.requestId;
  if (error instanceof DayaApiError) {
    if (error.details) body.details = error.details;
    if (error instanceof DayaValidationError) body.validation = error.validation;
  }

  const headers: Record<string, string> = {};
  if (error.requestId) headers["x-request-id"] = error.requestId;

  return Response.json(body, { status, headers });
}

/**
 * Wrap a handler to manage the Daya client lifecycle and error handling for
 * an App Router API route.
 *
 * @example
 * ```ts
 * // app/api/transfers/route.ts
 * import { createDayaRouteHandler } from "@okeke-dev/daya-next";
 *
 * export const POST = createDayaRouteHandler(async ({ request, daya }) => {
 *   const body = await request.json();
 *   const { transfer } = await daya.transfers.create(body);
 *   return Response.json(transfer, { status: 201 });
 * });
 * ```
 */
export function createDayaRouteHandler<TParams extends DayaRouteParams = DayaRouteParams>(
  handler: DayaRouteHandler<TParams>,
  options: DayaRouteHandlerOptions = {},
): (request: Request, context: { params: Promise<TParams> }) => Promise<Response> {
  return async function route(request, context) {
    let daya: Daya | undefined;
    try {
      const params = (context?.params ?? {}) as TParams | Promise<TParams>;
      const ctx: DayaRouteContext<TParams> = {
        request,
        params,
        // Build the client lazily: handlers that never touch `daya` (e.g. input
        // validation) must not fail on missing API configuration.
        get daya(): Daya {
          daya ??= toClient(options.client);
          return daya;
        },
      };
      return await handler(ctx);
    } catch (error) {
      return dayaApiErrorToResponse(error);
    }
  };
}

function toClient(client: Daya | DayaNextClientOptions | undefined): Daya {
  if (client instanceof Daya) return client;
  return createDayaClient(client);
}
