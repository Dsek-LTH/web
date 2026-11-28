import { describe, expect, it } from "vitest";
import { stickyTopFor } from "./sticky-top";

describe("stickyTopFor", () => {
  it("pins under a header that sits at the top of the viewport", () => {
    expect(stickyTopFor(64, 844)).toBe(64);
    expect(stickyTopFor(0, 844)).toBe(0);
  });

  it("ignores a bottom nav — the only header on phones", () => {
    // The mobile header's bottom edge is the viewport height; pinning under
    // it would throw the bar off-screen.
    expect(stickyTopFor(844, 844)).toBe(0);
    expect(stickyTopFor(900, 844)).toBe(0);
  });

  it("handles a missing header", () => {
    expect(stickyTopFor(undefined, 844)).toBe(0);
  });
});
