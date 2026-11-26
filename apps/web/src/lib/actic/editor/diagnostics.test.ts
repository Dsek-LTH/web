import { expect, test } from "vitest";
import { parseTypstDiagnostics } from "./diagnostics";

// 5 lines of 10 chars each, separated by newlines (total length 54).
const SOURCE = Array.from({ length: 5 }, (_, i) => `l${i}xxxxxxxx`).join("\n");

test("parses a ranged error into character offsets", () => {
  const diagnostics = parseTypstDiagnostics(
    "main.typ:2:2-3:5: error: unexpected type in `+` application",
    SOURCE,
  );
  expect(diagnostics).toHaveLength(1);
  // Line 2 col 2 = 11 + 1; line 3 col 5 = 22 + 4.
  expect(diagnostics[0]).toEqual({
    from: 12,
    to: 26,
    message: "unexpected type in `+` application",
    severity: "error",
  });
});

test("parses a point error as a zero-width range", () => {
  const diagnostics = parseTypstDiagnostics(
    "main.typ:4:3: error: unknown variable: foobar",
    SOURCE,
  );
  expect(diagnostics).toEqual([
    {
      from: 35,
      to: 35,
      message: "unknown variable: foobar",
      severity: "error",
    },
  ]);
});

test("parses warnings and several diagnostics from one blob", () => {
  const diagnostics = parseTypstDiagnostics(
    "main.typ:1:1-1:3: warning: unused variable\n" +
      "main.typ:5:11: error: expected expression",
    SOURCE,
  );
  // Col 11 clamps to the end of the last line (index 54).
  expect(diagnostics).toEqual([
    { from: 0, to: 2, message: "unused variable", severity: "warning" },
    { from: 54, to: 54, message: "expected expression", severity: "error" },
  ]);
});

test("skips diagnostics for other files, packages and non-diagnostic lines", () => {
  const diagnostics = parseTypstDiagnostics(
    "cetz:0.2.0@lib.typ:2:9-3:15: error: unexpected type\n" +
      "/grafik/guild/dsek/color.svg:1:1: error: bad image\n" +
      "/main.typ:2:2: error: main file error\n" +
      "Compilation failed",
    SOURCE,
  );
  expect(diagnostics).toEqual([
    { from: 12, to: 12, message: "main file error", severity: "error" },
  ]);
});

test("clamps positions beyond the document", () => {
  const diagnostics = parseTypstDiagnostics(
    "main.typ:99:5-99:99: error: out there\nmain.typ:3:999: error: far right",
    SOURCE,
  );
  // Line 99 clamps to line 5; line 3's column clamps to the line end.
  expect(diagnostics).toEqual([
    { from: 48, to: 54, message: "out there", severity: "error" },
    { from: 32, to: 32, message: "far right", severity: "error" },
  ]);
});

test("returns nothing for empty or non-diagnostic input", () => {
  expect(parseTypstDiagnostics("", SOURCE)).toEqual([]);
  expect(parseTypstDiagnostics("some wasm panic text", SOURCE)).toEqual([]);
});
