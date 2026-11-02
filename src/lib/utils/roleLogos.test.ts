import { describe, expect, it } from "vitest";
import { resolveRoleLogo, roleLogoMap } from "./roleLogos";

describe("resolveRoleLogo", () => {
  it("returns the logo of the closest ancestor", () => {
    const logos = roleLogoMap([
      { path: "dsek", logoUrl: "/guild.svg" },
      { path: "dsek.delta", logoUrl: "/delta.svg" },
      { path: "dsek.delta.projgr", logoUrl: "/delta-projgr.svg" },
    ]);

    expect(resolveRoleLogo("dsek.delta.projgr.general", logos)).toBe(
      "/delta-projgr.svg",
    );
  });

  it("falls back to a parent logo when the exact path has none", () => {
    const logos = roleLogoMap([{ path: "dsek.delta", logoUrl: "/delta.svg" }]);

    expect(resolveRoleLogo("dsek.delta.projgr.mdlm", logos)).toBe("/delta.svg");
  });

  it("does not use a sibling's logo", () => {
    const logos = roleLogoMap([{ path: "dsek.delta", logoUrl: "/delta.svg" }]);

    expect(resolveRoleLogo("dsek.nari.mastare", logos)).toBeUndefined();
  });

  it("returns undefined when nothing matches", () => {
    expect(
      resolveRoleLogo("dsek.nari.mastare", roleLogoMap([])),
    ).toBeUndefined();
  });
});
