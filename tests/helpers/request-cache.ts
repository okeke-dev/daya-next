type AnyCachedFunction = (...args: never[]) => unknown;

/**
 * Minimal structural stand-in for Next.js's `cache` (React's `cache`
 * re-export), used only by the test environment.
 *
 * Next resolves `next/cache` during builds; outside a Next application the
 * real module is unavailable, so the same memoize-by-arguments semantics are
 * provided here. Object and function arguments are keyed by reference (Map
 * identity), which matches React's cache behavior: the same argument reference
 * reuses the memoized result, a fresh object never does.
 */
export function cache<T extends AnyCachedFunction>(fn: T): T {
  type Slot = Map<unknown, unknown>;

  const root = new Map<unknown, unknown>();

  return ((...args: never[]) => {
    let slot = root;
    for (const arg of args) {
      let next = slot.get(arg) as Slot | undefined;
      if (next === undefined) {
        next = new Map<unknown, unknown>();
        slot.set(arg, next);
      }
      slot = next;
    }
    const resultKey = "__daya_next_result";
    if (!slot.has(resultKey)) {
      slot.set(resultKey, fn(...args));
    }
    return slot.get(resultKey);
  }) as T;
}
