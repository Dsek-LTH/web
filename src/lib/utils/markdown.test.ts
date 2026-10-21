import { describe, expect, it } from "vitest";
import { renderMarkdown, renderMarkdownExcerpt } from "./markdown";

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

  it("allows target=_blank and adds rel attributes", () => {
    const html = renderMarkdown(
      '<a href="https://example.com" target="_blank">external</a>',
    );

    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it("allows iframe embeds and their attributes", () => {
    const html = renderMarkdown(
      '<iframe src="https://www.youtube.com/embed/abc" title="Video" allow="autoplay; fullscreen" allowfullscreen frameborder="0" referrerpolicy="strict-origin-when-cross-origin" sandbox="allow-scripts allow-same-origin" loading="lazy"></iframe>',
    );

    expect(html).toContain("<iframe");
    expect(html).toContain('src="https://www.youtube.com/embed/abc"');
    expect(html).toContain('title="Video"');
    expect(html).toContain("allowfullscreen");
    expect(html).toContain("sandbox=");
    expect(html).toContain("loading=");
  });

  it("strips srcdoc, event handlers, and javascript iframe sources", () => {
    const html = renderMarkdown(
      '<iframe srcdoc="<script>alert(1)</script>" src="javascript:alert(1)" onload="alert(1)"></iframe>',
    );

    expect(html).not.toContain("srcdoc");
    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("onload");
    expect(html).not.toContain("<script");
  });

  it("supports inline rendering", () => {
    const html = renderMarkdown("**bold**", { inline: true });

    expect(html).toBe("<strong>bold</strong>");
  });

  it("keeps normal links", () => {
    const html = renderMarkdown("Read [the article](/news/example).");

    expect(html).toContain('<a href="/news/example">the article</a>');
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

describe("renderMarkdown line breaks", () => {
  it("does not convert single newlines into line breaks", () => {
    const html = renderMarkdown("first\nsecond");

    expect(html).not.toContain("<br");
  });

  it("preserves explicit line breaks", () => {
    const html = renderMarkdown("first<br>second");

    expect(html).toContain("<br");
    expect(html).toContain("first");
    expect(html).toContain("second");
  });
});
