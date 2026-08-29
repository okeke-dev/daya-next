/**
 * Thrown when required configuration (environment variables or explicit
 * options) is missing or invalid.
 *
 * This is a daya-next setup error, distinct from SDK API errors: it is thrown
 * during client construction, before any request is made.
 */
export class DayaNextConfigError extends Error {
  override readonly name = "DayaNextConfigError";

  constructor(message: string) {
    super(message);
  }
}
