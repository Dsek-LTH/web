import * as m from "$paraglide/messages";

/** Pinned Typst package version. The position list is generated from this version. */
export const DSEK_PACKAGE_VERSION = "0.1.0";
export const DSEK_PACKAGE = `@preview/dsek:${DSEK_PACKAGE_VERSION}`;

export type DocumentTypeId =
  | "motion"
  | "proposition"
  | "styrelsens-svar"
  | "handling";

export type AuthorInput = {
  /** Display name, required. */
  name: string;
  /** Either a `strings` key path (`styr.ordf`) or free text. */
  position?: { kind: "key"; path: string } | { kind: "text"; value: string };
  /** Signature message; empty means the package default ("Lund, dag som ovan"). */
  message?: string;
  /**
   * Uploaded signature image (ephemeral). `path` is a virtual path inside the
   * Typst compiler's shadow filesystem (the bytes are supplied separately).
   */
  signature?: { path: string };
};

export type YrkandeInput = { clause: string; description?: string };

export type DocumentInput = {
  type: DocumentTypeId;
  title: string;
  meeting: string;
  authors: AuthorInput[];
  lang: "sv" | "en";
  /** Omit for the package default (today). */
  date?: { year: number; month: number; day: number };
  /** Free Typst prose. */
  body: string;
  yrkanden?: { leadIn: string; items: YrkandeInput[] };
};

export type DocumentTypeMeta = {
  id: DocumentTypeId;
  /** Typst function to `#show`. */
  typstFunction: string;
  label: () => string;
  blurb: () => string;
};

export const DOCUMENT_TYPES: DocumentTypeMeta[] = [
  {
    id: "motion",
    typstFunction: "motion",
    label: m.actic_type_motion,
    blurb: m.actic_type_motion_blurb,
  },
  {
    id: "proposition",
    typstFunction: "proposition",
    label: m.actic_type_proposition,
    blurb: m.actic_type_proposition_blurb,
  },
  {
    id: "handling",
    typstFunction: "handling",
    label: m.actic_type_handling,
    blurb: m.actic_type_handling_blurb,
  },
  {
    id: "styrelsens-svar",
    typstFunction: "styrelsens-svar",
    label: m.actic_type_boardResponse,
    blurb: m.actic_type_boardResponse_blurb,
  },
];

export function getDocumentType(
  id: string | null | undefined,
): DocumentTypeMeta {
  return (
    DOCUMENT_TYPES.find((t) => t.id === id) ??
    (DOCUMENT_TYPES[0] as DocumentTypeMeta)
  );
}

/** Escape a value for use inside a Typst double-quoted string. */
function q(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

// Characters with meaning in Typst markup, plus leading list/heading markers.
const CONTENT_SPECIAL = "\\#$*_`<>@~[]";

/**
 * Render a plain-text value as Typst content (`[...]`). The package's `title`
 * and `meeting` parameters are `content`, so the values are emitted as content
 * rather than strings; markup characters are escaped so arbitrary user input
 * cannot change the document's formatting.
 */
function content(value: string): string {
  let out = "";
  for (const ch of value) {
    out += CONTENT_SPECIAL.includes(ch) ? `\\${ch}` : ch;
  }
  if (/^[-+/=]/.test(out)) out = `\\${out}`;
  return `[${out}]`;
}

function authorSource(author: AuthorInput): string {
  const parts = [`name: ${q(author.name)}`];
  if (author.position) {
    parts.push(
      author.position.kind === "key"
        ? `position: strings.${author.position.path}`
        : `position: ${q(author.position.value)}`,
    );
  }
  if (author.message?.trim()) {
    parts.push(`message: ${q(author.message)}`);
  }
  if (author.signature) {
    parts.push(`signature: signature-image(${q(author.signature.path)})`);
  }
  return `(\n      ${parts.join(",\n      ")},\n    )`;
}

function yrkandenSource(
  yrkanden: DocumentInput["yrkanden"],
  lang: DocumentInput["lang"],
): string {
  if (!yrkanden) return "";
  const items = yrkanden.items.filter((i) => i.clause.trim());
  if (items.length === 0) return "";
  const lead = yrkanden.leadIn.trim();
  // The package's resolution formatter recognises "att" (sv) / "to" (en); the
  // list is only styled as resolutions when every item starts with that term.
  const term = lang === "en" ? "to" : "att";
  const list = items
    .map((i) => {
      const head = `- ${term} ${i.clause.trim()}`;
      const desc = i.description?.trim();
      return desc ? `${head}\n  + ${desc}` : head;
    })
    .join("\n");
  return `${lead ? lead + "\n" : ""}${list}`;
}

/**
 * Build the full Typst source for a document. The body is placed after the show
 * rule (the package's trailing `body` parameter).
 */
export function buildDocumentSource(input: DocumentInput): string {
  const meta = getDocumentType(input.type);
  const authors = input.authors.filter((a) => a.name.trim());

  const showArgs = [
    `  title: ${content(input.title)}`,
    `  meeting: ${content(input.meeting)}`,
    `  authors: (\n    ${authors.map(authorSource).join(",\n    ")},\n  )`,
  ];
  // `lang` defaults to "sv" in the package, so only emit it for English.
  if (input.lang === "en") showArgs.push(`  lang: "en"`);
  // `date` defaults to today, so only emit it when a specific date is chosen.
  if (input.date) {
    showArgs.push(
      `  date: date(${input.date.day}, ${input.date.month}, ${input.date.year})`,
    );
  }

  const bodyParts = [
    input.body.trim(),
    yrkandenSource(input.yrkanden, input.lang),
  ].filter(Boolean);

  return [
    `#import "${DSEK_PACKAGE}": *`,
    ``,
    `#show: ${meta.typstFunction}.with(`,
    showArgs.join(",\n"),
    `)`,
    ``,
    bodyParts.join("\n\n"),
    ``,
  ].join("\n");
}

/** A short, filesystem-friendly slug for the download filename. */
export function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "dokument"
  );
}
