import { describe, expect, it } from "vitest";
import { sanitizeHtml } from "./sanitize";

describe("sanitizeHtml", () => {
  it("keeps allowed embed providers and enforces a sandbox", () => {
    const html = sanitizeHtml(
      '<iframe src="https://www.youtube-nocookie.com/embed/abc" allow="camera; microphone" allowfullscreen></iframe>',
    );

    expect(html).toContain("<iframe");
    expect(html).toContain('src="https://www.youtube-nocookie.com/embed/abc"');
    expect(html).toContain(
      'sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"',
    );
    expect(html).not.toContain("allow=");
  });

  it("removes iframes from unknown hosts", () => {
    const html = sanitizeHtml(
      '<iframe src="https://example.com/embed/abc"></iframe>',
    );

    expect(html).not.toContain("<iframe");
  });

  it("rejects non-embed pages even on allowed hosts", () => {
    expect(
      sanitizeHtml(
        '<iframe src="https://www.youtube.com/watch?v=abc"></iframe>',
      ),
    ).not.toContain("<iframe");
    expect(
      sanitizeHtml('<iframe src="https://youtu.be/abc"></iframe>'),
    ).not.toContain("<iframe");
    expect(
      sanitizeHtml('<iframe src="https://vimeo.com/123"></iframe>'),
    ).not.toContain("<iframe");
    expect(
      sanitizeHtml(
        '<iframe src="https://player.vimeo.com/video/123"></iframe>',
      ),
    ).toContain("<iframe");
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

  it("merges rel instead of overwriting it", () => {
    const html = sanitizeHtml(
      '<a href="https://example.com" target="_blank" rel="nofollow">external</a>',
    );

    expect(html).toContain('rel="nofollow noopener noreferrer"');
  });

  it("only allows safe target values", () => {
    const html = sanitizeHtml(
      '<a href="https://example.com" target="_top">external</a>',
    );

    expect(html).not.toContain("target=");
  });

  it("removes form controls and style tags", () => {
    const html = sanitizeHtml(
      '<p>safe</p><style>body{display:none}</style><form action="https://evil.com"><input type="password" name="pw"></form>',
    );

    expect(html).toContain("<p>safe</p>");
    expect(html).not.toContain("<style");
    expect(html).not.toContain("<form");
    expect(html).not.toContain("<input");
  });

  it("keeps the safe inline style subset", () => {
    const html = sanitizeHtml(
      '<p style="margin:0; font-family:monospace; color:#55ffff; font-weight:bold;">x</p>',
    );

    expect(html).toContain("margin:");
    expect(html).toContain("font-family: monospace");
    expect(html).toContain("color:");
    expect(html).toContain("font-weight: bold");
  });

  it("removes unsafe style properties and values", () => {
    const html = sanitizeHtml(
      '<p style="position:fixed; inset:0; z-index:999; display:flex; width:100vw; transform:scale(2); animation:x 1s; background:url(https://evil.com/x); color:red !important;">x</p>',
    );

    expect(html).toBe('<p style="color: red">x</p>');
  });

  it("strips all class attributes", () => {
    const html = sanitizeHtml(
      '<p class="custom underline fixed inset-0"><strong>text</strong></p>',
    );

    expect(html).toBe("<p><strong>text</strong></p>");
  });
});
