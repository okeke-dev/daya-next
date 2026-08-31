import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));
const distEntry = fileURLToPath(new URL("../../dist/index.js", import.meta.url));
// The built root entry also imports `next/cache`, so the fixture only loads
// when Next is installed (it is a peer dependency, installed by CI).
const nextInstalled = existsSync(
  fileURLToPath(new URL("../../node_modules/next/package.json", import.meta.url)),
);

/**
 * Verifies server-only enforcement end-to-end. Requires the compiled package
 * (`npm run build`) and an installed `next` peer — `npm run ci` installs,
 * builds, then tests to keep this file active.
 */
describe.skipIf(!existsSync(distEntry) || !nextInstalled)(
  "server-only guard (packaged entry)",
  () => {
    it("fails to import the built entry from a plain (browser-like) environment", async () => {
      // Running the fixture under a plain Node process has no `react-server`
      // export condition, so `server-only` must throw.
      await expect(
        execFileAsync(process.execPath, ["tests/fixtures/import-package.mjs"], {
          cwd: repoRoot,
          timeout: 20_000,
        }),
      ).rejects.toThrow(/This module cannot be imported from a Client Component module/);
    });

    it("resolves to the empty no-op build when the react-server condition is set (server side)", async () => {
      // Next.js resolves `server-only` via the `react-server` export condition,
      // which maps to the no-op empty module. Emulate it with --conditions.
      const result = await execFileAsync(
        process.execPath,
        ["--conditions=react-server", "tests/fixtures/import-package.mjs"],
        { cwd: repoRoot, timeout: 20_000 },
      );
      expect(result.stdout).toContain("LOADED");
    });
  },
);
