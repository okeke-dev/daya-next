# Contributing to @okeke-dev/daya-next

Thanks for contributing! This is a community-maintained package, and every help
counts — bug reports, docs fixes, and feature requests are all welcome.

## Getting started

```sh
npm install
npm run typecheck
npm run lint
npm run test
npm run build
npm run check:exports
npm run ci  # everything end-to-end
```

Requires Node.js **>= 18.18.0**.

## Project layout

```
src/
  index.ts                 # root entry — types + constants only (client-safe)
  server/index.ts          # /server entry — all runtime, secret-touching code
  client/                  # createDayaClient / getDayaClient
  webhooks/                # verifyDayaWebhook
  route-handlers/          # createDayaWebhookRoute / dayaErrorToResponse
  internal/                # env resolution, custom errors
  types/                   # options types, env constants, SDK type re-exports
tests/
  unit/                    # fast, no network
  integration/             # SDK client over a mocked fetch
  helpers/                 # webhook fixtures, server-only stub
examples/with-app-router/  # runnable Next.js example
```

## Conventions

- ESM-first: `"type": "module"`, `.js` extension in relative imports, emitted
  output must keep ESM + CJS parity (verify with `npm run build` and
  `npm run check:exports`).
- Strict TypeScript. No `any` unless unavoidable and reviewed. Import types with
  `import type`.
- Prettier defaults are defined in `.prettierrc` — run `npm run format` before
  committing.
- Every `src` change should come with a test. Webhook tests sign bodies with the
  SDK's `generateSignature` helper.
- **Never** inline secrets into bundles. Modules that touch secrets must
  `import "server-only"`.

## Adding or removing a public API

Public API includes the root and `/server` entry points plus everything in
`src/types/index.ts`. When changing them:

1. Update `src/server/index.ts` and/or `src/index.ts` re-exports.
2. Update the README API surface and the SDK type re-exports as needed.
3. Run `npm run build` and `npm run check:exports` (publint + AreTheTypesWrong).
4. Note the change in `CHANGELOG.md` under [Unreleased].

## Committing

- Keep commits small and focused; use conventional prefixes (`feat:`, `fix:`,
  `docs:`, `test:`, `chore:`).
- Rebase locally before opening a PR.
- CI (`.github/workflows/ci.yml`) must pass on your PR branch.

## Asking questions

Open an issue or Discussion on GitHub. For security issues, see
[SECURITY.md](./SECURITY.md) and **do not** open a public issue.
