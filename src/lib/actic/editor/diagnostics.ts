/**
 * Compiler diagnostics for the source editor, parsed from the worker's
 * unix-format error text (`path:line:col-endLine:endCol: severity: message`,
 * 1-based, per typst.ts) into CodeMirror-compatible character offsets.
 */
export type TypstDiagnostic = {
  from: number;
  to: number;
  message: string;
  severity: "error" | "warning";
};

const DIAGNOSTIC_LINE =
  /^(.+):(\d+):(\d+)(?:-(\d+):(\d+))?:\s*(error|warning):\s*(.*)$/;

/** Character offsets for each 1-based line/column pair in `source`. */
function lineStarts(source: string): number[] {
  const starts = [0];
  for (let i = 0; i < source.length; i++) {
    if (source[i] === "\n") starts.push(i + 1);
  }
  return starts;
}

export function parseTypstDiagnostics(
  raw: string,
  source: string,
): TypstDiagnostic[] {
  if (!raw.trim()) return [];
  const starts = lineStarts(source);
  const lineCount = starts.length;

  /** A 1-based line/col, clamped into the document. */
  function offset(line: number, column: number): number {
    const index = Math.min(Math.max(line, 1), lineCount) - 1;
    const lineEnd =
      index + 1 < lineCount ? starts[index + 1]! - 1 : source.length;
    return Math.min(starts[index]! + Math.max(column, 1) - 1, lineEnd);
  }

  const diagnostics: TypstDiagnostic[] = [];
  for (const entry of raw.split("\n")) {
    const match = DIAGNOSTIC_LINE.exec(entry.trim());
    // Skip other files (assets, packages) and plain error text.
    if (!match) continue;
    const [, path, line, column, endLine, endColumn, severity, message] = match;
    if (path!.replace(/^\//, "") !== "main.typ") continue;
    const from = offset(Number(line), Number(column));
    const to =
      endLine !== undefined && endColumn !== undefined
        ? offset(Number(endLine), Number(endColumn))
        : from;
    diagnostics.push({
      from,
      to,
      message: message!,
      severity: severity as "error" | "warning",
    });
  }
  return diagnostics;
}
