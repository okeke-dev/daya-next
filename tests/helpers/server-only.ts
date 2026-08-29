// Vitest build-time alias target for the `server-only` guard package.
//
// Next.js resolves the `server-only` import to its server build automatically.
// The standalone npm package throws when imported by a plain Node process, so
// in the test environment we satisfy the import with this no-op module.
export {};
