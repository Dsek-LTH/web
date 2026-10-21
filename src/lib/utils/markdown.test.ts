import { describe, expect, it } from "vitest";
import {
  renderMarkdown,
  renderMarkdownExcerpt,
  renderMarkdownInlineWithBreaks,
} from "./markdown";

describe("renderMarkdown", () => {
  it("renders normal markdown", () => {
    const html = renderMarkdown(
      "# Heading\n\n**bold** and *italic*\n\n- one\n- two",
    );

    expect(html).toContain("<h1>Heading</h1>");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<em>italic</em>");
    expect(html).toContain("<li>one</li>");
  });

  it("removes scripts and event handlers", () => {
    const html = renderMarkdown(
      `<script>alert("xss")</script><img src="x" onerror="alert('xss')">`,
    );

    expect(html).not.toContain("<script");
    expect(html).not.toContain("onerror");
    expect(html).not.toContain("alert(");
  });

  it("rejects javascript: links", () => {
    const html = renderMarkdown("[click me](javascript:alert('xss'))");

    expect(html).toContain("click me");
    expect(html).not.toContain("javascript:");
  });

  it("supports inline rendering", () => {
    const html = renderMarkdown("**bold**", { inline: true });

    expect(html).toBe("<strong>bold</strong>");
  });
});

describe("renderMarkdownExcerpt", () => {
  it("removes links and headings but keeps their text", () => {
    const html = renderMarkdownExcerpt(
      "# Heading\n\nRead [the full article](https://example.com).",
    );

    expect(html).toContain("Heading");
    expect(html).toContain("the full article");
    expect(html).not.toContain("<h1");
    expect(html).not.toContain("<a ");
  });

  it("sanitizes raw HTML", () => {
    const html = renderMarkdownExcerpt(`<img src="x" onerror="alert('xss')">`);

    expect(html).not.toContain("onerror");
  });
});

describe("renderMarkdownInlineWithBreaks", () => {
  it("preserves line breaks", () => {
    const html = renderMarkdownInlineWithBreaks("first\nsecond");

    expect(html).toContain("<br");
    expect(html).toContain("first");
    expect(html).toContain("second");
  });

  it("sanitizes raw HTML", () => {
    const html = renderMarkdownInlineWithBreaks(
      `<script>alert("xss")</script>`,
    );

    expect(html).not.toContain("<script");
    expect(html).not.toContain("alert(");
  });
});
