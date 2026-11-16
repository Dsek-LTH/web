import { expect, test } from "vitest";
import { hangingIndentOf } from "./hangingIndent";

test("plain indentation carries over to wrapped lines", () => {
  expect(hangingIndentOf("    wrapped text", 4)).toBe(4);
});

test("tabs count as tabSize columns", () => {
  expect(hangingIndentOf("\t\tx", 4)).toBe(8);
  expect(hangingIndentOf("\t- foo", 2)).toBe(4);
});

test("list markers add their own width", () => {
  expect(hangingIndentOf("- foo", 4)).toBe(2);
  expect(hangingIndentOf("  - foo", 4)).toBe(4);
  expect(hangingIndentOf("+ foo", 4)).toBe(2); // Typst's enum marker
  expect(hangingIndentOf("/ foo", 4)).toBe(2);
  expect(hangingIndentOf("1. foo", 4)).toBe(3);
  expect(hangingIndentOf("100. foo", 4)).toBe(5);
  expect(hangingIndentOf("- ", 4)).toBe(2);
});

test("comments are not list markers", () => {
  expect(hangingIndentOf("// a comment", 4)).toBe(0);
  expect(hangingIndentOf("  // indented comment", 4)).toBe(2); // whitespace only
});

test("marker-like text without a trailing space is not a list", () => {
  expect(hangingIndentOf("-foo", 4)).toBe(0);
  expect(hangingIndentOf("1.foo", 4)).toBe(0);
});

test("plain lines and empty lines get no offset", () => {
  expect(hangingIndentOf("foo", 4)).toBe(0);
  expect(hangingIndentOf("", 4)).toBe(0);
});
