import { describe, expect, it } from "vitest";
import { sanitizeHtml } from "./sanitize";

describe("sanitizeHtml", () => {
  it("keeps allowed embed providers and enforces a sandbox", () => {
    const html = sanitizeHtml(
      '<iframe src="https://www.youtube-nocookie.com/embed/abc" allowfullscreen></iframe>',
    );

    expect(html).toContain("<iframe");
    expect(html).toContain('src="https://www.youtube-nocookie.com/embed/abc"');
    expect(html).toContain(
      'sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"',
    );
  });

  it("removes iframes from unknown hosts", () => {
    const html = sanitizeHtml(
      '<iframe src="https://example.com/embed/abc"></iframe>',
    );

    expect(html).not.toContain("<iframe");
  });

  it("removes iframes with javascript: sources", () => {
    const html = sanitizeHtml('<iframe src="javascript:alert(1)"></iframe>');

    expect(html).not.toContain("<iframe");
    expect(html).not.toContain("javascript:");
  });

  it("explicitly removes srcdoc", () => {
    const html = sanitizeHtml(
      '<iframe srcdoc="<script>alert(1)</script>" src="https://www.youtube.com/embed/abc"></iframe>',
    );

    expect(html).not.toContain("srcdoc");
    expect(html).not.toContain("<script");
  });

  it("adds rel protection to target=_blank links", () => {
    const html = sanitizeHtml(
      '<a href="https://example.com" target="_blank">external</a>',
    );

    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it("keeps normal formatting", () => {
    const html = sanitizeHtml(
      '<p style="color: red" class="custom"><strong>text</strong></p>',
    );

    expect(html).toContain('style="color: red"');
    expect(html).toContain('class="custom"');
    expect(html).toContain("<strong>text</strong>");
  });
});
