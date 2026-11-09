import { describe, expect, it } from "vitest";
import { toExcerpt } from "./excerpt";

describe("toExcerpt", () => {
  it("joins paragraphs into one line", () => {
    expect(toExcerpt("Hej\n\nJag heter Batman")).toBe("Hej Jag heter Batman");
  });

  it("drops Markdown formatting, headings and links but keeps their text", () => {
    expect(
      toExcerpt("# Rubrik\n\n**Fet** text med [en länk](https://dsek.se)."),
    ).toBe("Rubrik Fet text med en länk.");
  });

  it("decodes entities", () => {
    expect(toExcerpt("Kaffe & kaka <3")).toBe("Kaffe & kaka <3");
  });

  it("cuts long bodies", () => {
    expect(toExcerpt("a".repeat(500), 10)).toBe("a".repeat(10));
  });
});
