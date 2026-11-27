import { expect, test } from "vitest";
import {
  buildDocumentSource,
  documentSlug,
  hasDocumentContent,
  validateDocument,
  type DocumentInput,
} from "./dsek";

const planInput = (
  overrides?: Partial<Extract<DocumentInput, { family: "plan-of-operations" }>>,
): DocumentInput => ({
  lang: "sv",
  body: "",
  family: "plan-of-operations",
  year: 2027,
  ...overrides,
});

const plainInput = (
  overrides?: Partial<Extract<DocumentInput, { family: "plain-document" }>>,
): DocumentInput => ({
  lang: "sv",
  body: "",
  family: "plain-document",
  title: "",
  meeting: "",
  docType: "",
  useCoverPage: false,
  ...overrides,
});

test("plan of operations: pins the year and wraps the body", () => {
  const source = buildDocumentSource(
    planInput({ body: "Ett mål\n\n- att sjunga mer" }),
  );
  expect(source).toContain('#import "@preview/dsek:0.1.0": *');
  expect(source).toContain("#show: verksamhetsplan.with(");
  // The package default is next year, so the year is emitted explicitly —
  // a saved draft must mean the same thing next year.
  expect(source).toContain("year: 2027");
  expect(source.trimEnd().endsWith("Ett mål\n\n- att sjunga mer")).toBe(true);
});

test("plan of operations: always valid, content only with body", () => {
  expect(validateDocument(planInput())).toEqual([]);
  expect(hasDocumentContent(planInput())).toBe(false);
  expect(hasDocumentContent(planInput({ body: "mål" }))).toBe(true);
  expect(documentSlug(planInput())).toBe("verksamhetsplan-2027");
});

test("plain document: doc type and cover page reach the source", () => {
  const source = buildDocumentSource(
    plainInput({
      title: "Utredning",
      meeting: "HTM1",
      docType: "Verksamhetsberättelse",
      useCoverPage: true,
      body: "Här är texten",
    }),
  );
  expect(source).toContain("#show: dokument.with(");
  expect(source).toContain("title: [Utredning]");
  expect(source).toContain("meeting: [HTM1]");
  expect(source).toContain('doc-type: "Verksamhetsberättelse"');
  expect(source).toContain("use-cover-page: true");
  expect(source.trimEnd().endsWith("Här är texten")).toBe(true);
});

test("plain document: an empty meeting is left out of the source", () => {
  const source = buildDocumentSource(plainInput({ title: "A", meeting: "  " }));
  expect(source).not.toContain("meeting:");
});

test("plain document: only the title is required", () => {
  const missing = validateDocument(plainInput());
  expect(missing).toHaveLength(1);
  expect(hasDocumentContent(plainInput({ docType: "x" }))).toBe(true);
  expect(documentSlug(plainInput({ title: "A", meeting: "HTM" }))).toBe(
    "dokument-htm-a",
  );
  expect(documentSlug(plainInput({ title: "A" }))).toBe("dokument-a");
});
