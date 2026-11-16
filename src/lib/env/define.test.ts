import { describe, expect, it } from "vitest";
import { checkEnv, defineEnv, type EnvSpec } from "./define";

const spec = {
  REQUIRED: { required: true },
  WITH_DEFAULT: { default: "fallback" },
  FEATURE_A: { feature: "feature" },
  FEATURE_B: { feature: "feature" },
  PLAIN: {},
} satisfies EnvSpec;

describe("defineEnv", () => {
  it("returns set values", () => {
    const env = defineEnv(spec, () => "value");
    expect(env.WITH_DEFAULT).toBe("value");
  });

  it("falls back to the default when unset or empty", () => {
    expect(defineEnv(spec, () => undefined).WITH_DEFAULT).toBe("fallback");
    expect(defineEnv(spec, () => "").WITH_DEFAULT).toBe("fallback");
  });

  it("returns an empty string for unset variables without a default", () => {
    expect(defineEnv(spec, () => undefined).PLAIN).toBe("");
  });

  it("reads values on access", () => {
    const values: Record<string, string> = {};
    const env = defineEnv(spec, (name) => values[name]);
    expect(env.PLAIN).toBe("");
    values["PLAIN"] = "later";
    expect(env.PLAIN).toBe("later");
  });
});

describe("checkEnv", () => {
  it("reports missing required variables and turned off features", () => {
    const { missing, disabled } = checkEnv(
      spec,
      defineEnv(spec, () => undefined),
    );
    expect(missing).toEqual(["REQUIRED"]);
    expect(disabled).toEqual(
      new Map([["feature", ["FEATURE_A", "FEATURE_B"]]]),
    );
  });

  it("reports nothing when everything is set", () => {
    const { missing, disabled } = checkEnv(
      spec,
      defineEnv(spec, () => "value"),
    );
    expect(missing).toEqual([]);
    expect(disabled.size).toBe(0);
  });
});
