import { describe, expect, it } from "vitest";
import { escapeHtml } from "./html";

describe("escapeHtml", () => {
  it("escapes markup", () => {
    expect(escapeHtml(`<img src=x onerror="alert('x')">&`)).toBe(
      "&lt;img src=x onerror=&quot;alert(&#39;x&#39;)&quot;&gt;&amp;",
    );
  });
  it("leaves plain text alone", () => {
    expect(escapeHtml("Protokoll 2026-01.pdf")).toBe("Protokoll 2026-01.pdf");
  });
});
