import { describe, expect, it } from "vitest";
import { escapeHtml } from "./escapeHtml";

describe("escapeHtml", () => {
  it("escapes HTML special characters", () => {
    expect(escapeHtml(`<img src=x onerror="alert('x')">&`)).toBe(
      "&lt;img src=x onerror=&quot;alert(&#39;x&#39;)&quot;&gt;&amp;",
    );
  });

  it("leaves plain text unchanged", () => {
    expect(escapeHtml("Råsenbad (styrelserummet)")).toBe(
      "Råsenbad (styrelserummet)",
    );
  });
});
