import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));
const distEntryCjs = fileURLToPath(new URL("../../dist/index.cjs", import.meta.url));
const reactInstalled = existsSync(
  fileURLToPath(new URL("../../node_modules/react/package.json", import.meta.url)),
);

/**
 * Verifies server-only enforcement end-to-end. Requires the compiled package
 * (`npm run build`) and an installed `react` peer — `npm run ci` installs,
 * builds, then tests to keep this file active.
 *
 * The CJS entry is used because it resolves `react` via CJS legacy resolution;
 * the ESM entry's bare `react` import requires a resolver aware of the
 * `react` package exports (Next's bundler handles it in apps).
 */
describe.skipIf(!existsSync(distEntryCjs) || !reactInstalled)(
  "server-only guard (packaged entry)",
  () => {
    it("fails to import the built entry from a plain (browser-like) environment", async () => {
      // Running the fixture under a plain Node process has no `react-server`
      // export condition, so `server-only` must throw.
      await expect(
        execFileAsync(process.execPath, ["tests/fixtures/import-package.cjs"], {
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
        ["--conditions=react-server", "tests/fixtures/import-package.cjs"],
        { cwd: repoRoot, timeout: 20_000 },
      );
      expect(result.stdout).toContain("LOADED");
    });
  },
);
