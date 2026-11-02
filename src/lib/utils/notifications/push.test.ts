import { describe, expect, it, vi } from "vitest";
import { getUnregisteredTokens } from "./push";

vi.mock("$lib/server/authorizedPrisma", () => ({ default: {} }));
vi.mock("$lib/server/metrics", () => ({}));

describe("getUnregisteredTokens", () => {
  it("only returns tokens Expo says are no longer registered", () => {
    expect(
      getUnregisteredTokens([
        {
          status: "error",
          message: "gone",
          details: {
            error: "DeviceNotRegistered",
            expoPushToken: "ExponentPushToken[gone]",
          },
        },
        {
          status: "error",
          message: "slow down",
          details: {
            error: "MessageRateExceeded",
            expoPushToken: "ExponentPushToken[kept]",
          },
        },
        { status: "error", message: "no details" },
      ]),
    ).toEqual(["ExponentPushToken[gone]"]);
  });
});
