# Example — Next.js App Router + @okeke-dev/daya-next

A minimal App Router app wired to `@okeke-dev/daya-next` via
`"@okeke-dev/daya-next": "file:../../"`.

## Run

```sh
cd examples/with-app-router
npm install   # triggers the pack's prepack → builds the package from ../../dist
cp .env.example .env.local   # add your DAYA_API_KEY / DAYA_WEBHOOK_SECRET
npm run dev
```

Open http://localhost:3000 — the index page calls the Daya rates endpoint and
renders the rate. Without `DAYA_API_KEY`, it renders a friendly config error.

POST to `/api/webhooks/daya` to exercise webhook verification. To test locally,
sign a body with the SDK's `generateSignature`:

```ts
import { generateSignature } from "@okeke-dev/daya-sdk";
console.log(generateSignature(JSON.stringify(payload), process.env.DAYA_WEBHOOK_SECRET!));
```

## Notes

- All Daya calls must live in Route Handlers / Server Components / Server
  Actions. This example never imports `@okeke-dev/daya-next/server` from a
  client component; the `webhook-secret` check in `lib/daya.ts` is illustrative
  only.
- The webhook route sets `export const runtime = "nodejs"` (Edge is not
  supported by webhook verification).
