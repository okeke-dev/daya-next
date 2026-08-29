# Security Policy

## Supported versions

Security updates are released for the latest published minor version of
`@okeke-dev/daya-next`, read as 0.x. Stay on the newest version.

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |
| < 0.1   | :x:                |

## Reporting a vulnerability

Please **do not** open a public issue for security problems. Report privately to
the maintainer by email:

**okekechimezieglory@gmail.com**

Please include:

- Package version(s) affected.
- A minimal reproduction (the less code, the better).
- What an attacker could plausibly gain.

You should receive an acknowledgement within 48 hours. We will coordinate a fix,
changelog entry, and versioned release before any public disclosure.

## Security model

- **Secrets live on the server only.** The root entry
  (`@okeke-dev/daya-next`) exports types and constants; nothing reads
  `process.env` at module scope or ships secret values into bundles. Runtime
  entry (`@okeke-dev/daya-next/server`) is guarded by the `server-only` package,
  and Next.js fails client imports of it at build time.
- **Webhook integrity.** Signatures are HMAC-SHA256 computed over the exact raw
  request body and compared with `node:crypto.timingSafeEqual`. Never
  re-serialize a parsed JSON body before verification.
- **Runtime.** Only the Node.js runtime is supported. The Edge Runtime does not
  expose the Node crypto primitives used by webhook verification, and Daya
  secrets must never reach the edge/client bundle anyway.
- **Dependencies.** `@okeke-dev/daya-sdk` is held at its latest published
  version; `npm audit` and dependency updates run in CI.

## Dependency hygiene

- You MUST audit before each release: `npm audit`.
- Prefer long-lived, pinned-major range dependencies (`^`) for published
  releases; the lockfile pins exact versions in CI.
- Disclose supply-chain concerns the same way as above.
