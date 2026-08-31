// Ambient types for Next.js's `cache` re-export.
//
// `next` is this package's only peer dependency. It is intentionally not
// installed in minimal dev toolchains: Next provides the real `next/cache`
// module declaration in every application that consumes this package. This
// minimal mirror lets our own source and tests type-check in isolation. It is
// not imported by any entry, so it is never part of the published type bundle.
declare module "next/cache" {
  export function cache<T extends (...args: never[]) => unknown>(fn: T): T;
}
