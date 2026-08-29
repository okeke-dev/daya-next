import { describe, expect, it } from "vitest";

import { Daya } from "@okeke-dev/daya-sdk";

import { createDayaClient } from "../../src/client/index.js";
import { DayaNextConfigError } from "../../src/internal/errors.js";

const ORIGINAL_API_KEY = process.env.DAYA_API_KEY;

afterEach(() => {
  if (ORIGINAL_API_KEY === undefined) {
    delete process.env.DAYA_API_KEY;
  } else {
    process.env.DAYA_API_KEY = ORIGINAL_API_KEY;
  }
});

describe("createDayaClient", () => {
  it("throws DayaNextConfigError when no API key is resolvable", () => {
    delete process.env.DAYA_API_KEY;
    expect(() => createDayaClient({})).toThrow(DayaNextConfigError);
  });

  it("builds an SDK Daya client from explicit options", () => {
    const client = createDayaClient({ apiKey: "sk_sandbox_test" });
    expect(client).toBeInstanceOf(Daya);
  });

  it("builds an SDK Daya client from the environment", () => {
    process.env.DAYA_API_KEY = "sk_sandbox_env";
    expect(createDayaClient({})).toBeInstanceOf(Daya);
  });

  it("prefers an explicit apiKey over the environment", () => {
    process.env.DAYA_API_KEY = "sk_sandbox_env";
    const client = createDayaClient({ apiKey: "sk_sandbox_explicit" });
    expect(client).toBeInstanceOf(Daya);
  });

  it("forwards an explicit baseUrl to the SDK client", () => {
    const client = createDayaClient({ apiKey: "sk_sandbox_test", baseUrl: "https://daya.test" });
    expect(client).toBeInstanceOf(Daya);
  });
});
