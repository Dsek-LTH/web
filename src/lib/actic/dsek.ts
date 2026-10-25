import * as m from "$paraglide/messages";

/** Pinned Typst package version. The position list is generated from this version. */
export const DSEK_PACKAGE_VERSION = "0.1.0";
export const DSEK_PACKAGE = `@preview/dsek:${DSEK_PACKAGE_VERSION}`;

/** The concrete templates that share the deliberation family's field set. */
export type DeliberationTypeId =
  | "motion"
  | "proposition"
  | "styrelsens-svar"
  | "handling";

/** Top-level document families. Each has its own guided form. */
export type FamilyId =
  | "deliberation"
  | "equal-treatment-plan"
  | "requirements-profile"
  | "nomination";

/** Every concrete document template actic can produce. */
export type DocumentTypeId =
  | DeliberationTypeId
  | "equal-treatment-plan"
  | "requirements-profile"
  | "nomination";

/** A value picked from the package `strings` (a key path) or typed freely. */
export type KeyedValue =
  | { kind: "key"; path: string }
  | { kind: "text"; value: string };

export type AuthorInput = {
  /** Display name, required. */
  name: string;
  /** Either a `strings` key path (`styr.ordf`) or free text. */
  position?: KeyedValue;
  /** Signature message; empty means the package default ("Lund, dag som ovan"). */
  message?: string;
  /**
   * Uploaded signature image. `path` is a virtual path inside the Typst
   * compiler's shadow filesystem (the bytes are supplied separately).
   */
  signature?: { path: string };
};

export type YrkandeInput = { clause: string; description?: string };
export type YrkandenInput = { leadIn: string; items: YrkandeInput[] };

export type DateParts = { year: number; month: number; day: number };

/** One position in a nomination, with its nominees and optional applicant range. */
export type CandidateGroup = {
  position: string;
  nominees: string[];
  /** Free-text applicant range (e.g. `0 -- 4`). Only emitted when every group has one. */
  stat?: string;
};

export type MandateInput =
  | { mode: "year"; year: number }
  | { mode: "custom"; from: DateParts; to: DateParts };

/** The mandate as held in the form/draft (dates are ISO strings). */
export type MandateValue =
  | { mode: "year"; year: number }
  | { mode: "custom"; fromIso: string; toIso: string };

type CommonInput = { lang: "sv" | "en"; date?: DateParts; body: string };

export type DocumentInput =
  | (CommonInput & {
      family: "deliberation";
      type: DeliberationTypeId;
      title: string;
      meeting: string;
      authors: AuthorInput[];
      yrkanden?: YrkandenInput;
    })
  | (CommonInput & {
      family: "equal-treatment-plan";
      committee: KeyedValue | null;
      /** The year the plan is active for. */
      year: number;
      meeting: string;
    })
  | (CommonInput & {
      family: "requirements-profile";
      position: KeyedValue | null;
      requirements: string[];
      merits: string[];
      mandate: MandateInput;
    })
  | (CommonInput & {
      family: "nomination";
      title: string;
      meeting: string;
      authors: AuthorInput[];
      candidates: CandidateGroup[];
      statsEnabled: boolean;
      yrkanden?: YrkandenInput;
    });

export type FamilyGroup = "meetings" | "other";

export type FamilyMeta = {
  id: FamilyId;
  group: FamilyGroup;
  hasAuthors: boolean;
  hasResolutions: boolean;
  hasMeeting: boolean;
  /** Concrete templates in this family (deliberation has four). */
  typeIds: DocumentTypeId[];
};

export const FAMILIES: FamilyMeta[] = [
  {
    id: "deliberation",
    group: "meetings",
    hasAuthors: true,
    hasResolutions: true,
    hasMeeting: true,
    typeIds: ["motion", "proposition", "handling", "styrelsens-svar"],
  },
  {
    id: "equal-treatment-plan",
    group: "other",
    hasAuthors: false,
    hasResolutions: false,
    hasMeeting: true,
    typeIds: ["equal-treatment-plan"],
  },
  {
    id: "requirements-profile",
    group: "other",
    hasAuthors: false,
    hasResolutions: false,
    hasMeeting: false,
    typeIds: ["requirements-profile"],
  },
  {
    id: "nomination",
    group: "other",
    hasAuthors: true,
    hasResolutions: true,
    hasMeeting: true,
    typeIds: ["nomination"],
  },
];

export type DocumentTypeMeta = {
  id: DocumentTypeId;
  family: FamilyId;
  /** Typst function to `#show`. */
  typstFunction: string;
  label: () => string;
  blurb: () => string;
};

export const DOCUMENT_TYPES: DocumentTypeMeta[] = [
  {
    id: "motion",
    family: "deliberation",
    typstFunction: "motion",
    label: m.actic_type_motion,
    blurb: m.actic_type_motion_blurb,
  },
  {
    id: "proposition",
    family: "deliberation",
    typstFunction: "proposition",
    label: m.actic_type_proposition,
    blurb: m.actic_type_proposition_blurb,
  },
  {
    id: "handling",
    family: "deliberation",
    typstFunction: "handling",
    label: m.actic_type_handling,
    blurb: m.actic_type_handling_blurb,
  },
  {
    id: "styrelsens-svar",
    family: "deliberation",
    typstFunction: "styrelsens-svar",
    label: m.actic_type_boardResponse,
    blurb: m.actic_type_boardResponse_blurb,
  },
  {
    id: "equal-treatment-plan",
    family: "equal-treatment-plan",
    typstFunction: "equal-treatment-plan",
    label: m.actic_type_equalTreatmentPlan,
    blurb: m.actic_type_equalTreatmentPlan_blurb,
  },
  {
    id: "requirements-profile",
    family: "requirements-profile",
    typstFunction: "requirements-profile",
    label: m.actic_type_requirementsProfile,
    blurb: m.actic_type_requirementsProfile_blurb,
  },
  {
    id: "nomination",
    family: "nomination",
    typstFunction: "nomination-proposal",
    label: m.actic_type_nomination,
    blurb: m.actic_type_nomination_blurb,
  },
];

export function getFamily(id: string | null | undefined): FamilyMeta {
  return FAMILIES.find((f) => f.id === id) ?? (FAMILIES[0] as FamilyMeta);
}

export function getDocumentType(
  id: string | null | undefined,
): DocumentTypeMeta {
  return (
    DOCUMENT_TYPES.find((t) => t.id === id) ??
    (DOCUMENT_TYPES[0] as DocumentTypeMeta)
  );
}

// --- source helpers --------------------------------------------------------

/** Escape a value for use inside a Typst double-quoted string. */
function q(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

// Characters with meaning in Typst markup, plus leading list/heading markers.
const CONTENT_SPECIAL = "\\#$*_`<>@~[]";

/**
 * Render a plain-text value as Typst content (`[...]`). Several package
 * parameters are `content`, so the values are emitted as content rather than
 * strings; markup characters are escaped so arbitrary user input cannot change
 * the document's formatting.
 */
function content(value: string): string {
  let out = "";
  for (const ch of value) {
    out += CONTENT_SPECIAL.includes(ch) ? `\\${ch}` : ch;
  }
  if (/^[-+/=]/.test(out)) out = `\\${out}`;
  return `[${out}]`;
}

/** A `strings` key path, free text, or empty content when unset. */
function keyed(value: KeyedValue | null): string {
  if (!value) return "[]";
  if (value.kind === "key") return `strings.${value.path}`;
  return content(value.value);
}

/**
 * The committee content with the plan year appended. The next package update
 * takes a dedicated `year` parameter (which it puts in the title); until that
 * ships, the year rides along on the committee, the only title input.
 */
function committeeWithYear(value: KeyedValue | null, year: number): string {
  if (!value) return "[]";
  const name =
    value.kind === "key"
      ? `#strings.${value.path}.name`
      : content(value.value).slice(1, -1);
  return `[${name} ${year}]`;
}

/** An array of strings, as Typst `("a", "b",)`. Empty becomes `()`. */
function stringList(values: string[]): string {
  const items = values.map((v) => v.trim()).filter(Boolean);
  if (items.length === 0) return "()";
  return `(\n    ${items.map(q).join(",\n    ")},\n  )`;
}

function langDateArgs(input: CommonInput): string[] {
  const args: string[] = [];
  // `lang` defaults to "sv" in the package, so only emit it for English.
  if (input.lang === "en") args.push(`  lang: "en"`);
  // `date` defaults to today, so only emit it when a specific date is chosen.
  if (input.date) {
    args.push(
      `  date: date(${input.date.day}, ${input.date.month}, ${input.date.year})`,
    );
  }
  return args;
}

function assemble(
  typstFunction: string,
  showArgs: string[],
  bodyParts: string[],
): string {
  return [
    `#import "${DSEK_PACKAGE}": *`,
    ``,
    `#show: ${typstFunction}.with(`,
    showArgs.join(",\n"),
    `)`,
    ``,
    bodyParts.join("\n\n"),
    ``,
  ].join("\n");
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

function authorsSource(authors: AuthorInput[]): string {
  const named = authors.filter((a) => a.name.trim());
  return `(\n    ${named.map(authorSource).join(",\n    ")},\n  )`;
}

function yrkandenSource(
  yrkanden: YrkandenInput | undefined,
  lang: CommonInput["lang"],
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

/** The body of a nomination, which can carry resolutions like a motion. */
function bodyWithYrkanden(
  body: string,
  yrkanden: YrkandenInput | undefined,
  lang: CommonInput["lang"],
): string[] {
  return [body.trim(), yrkandenSource(yrkanden, lang)].filter(Boolean);
}

function candidatesSource(groups: CandidateGroup[]): string {
  const entries = groups
    .filter((g) => g.position.trim() && g.nominees.some((n) => n.trim()))
    .map((g) => {
      const nominees = g.nominees.filter((n) => n.trim()).map(q);
      const value =
        nominees.length === 1
          ? (nominees[0] as string)
          : `(\n      ${nominees.join(",\n      ")},\n    )`;
      return `    ${q(g.position.trim())}: ${value}`;
    });
  return `(\n${entries.join(",\n")},\n  )`;
}

/** Every candidate group carries a non-empty applicant range. */
export function hasCompleteStats(groups: CandidateGroup[]): boolean {
  const withPositions = groups.filter(
    (g) => g.position.trim() && g.nominees.some((n) => n.trim()),
  );
  return (
    withPositions.length > 0 && withPositions.every((g) => !!g.stat?.trim())
  );
}

function statsSource(groups: CandidateGroup[]): string {
  const entries = groups
    .filter((g) => g.position.trim())
    .map((g) => `    ${q(g.position.trim())}: ${content(g.stat ?? "")}`);
  return `(\n${entries.join(",\n")},\n  )`;
}

// --- builders --------------------------------------------------------------

function deliberationSource(
  input: Extract<DocumentInput, { family: "deliberation" }>,
): string {
  const meta = getDocumentType(input.type);
  const showArgs = [
    `  title: ${content(input.title)}`,
    `  meeting: ${content(input.meeting)}`,
    `  authors: ${authorsSource(input.authors)}`,
    ...langDateArgs(input),
  ];
  return assemble(
    meta.typstFunction,
    showArgs,
    bodyWithYrkanden(input.body, input.yrkanden, input.lang),
  );
}

function equalTreatmentPlanSource(
  input: Extract<DocumentInput, { family: "equal-treatment-plan" }>,
): string {
  const showArgs = [
    `  committee: ${committeeWithYear(input.committee, input.year)}`,
    `  meeting: ${content(input.meeting)}`,
    ...langDateArgs(input),
  ];
  return assemble(
    "equal-treatment-plan",
    showArgs,
    [input.body.trim()].filter(Boolean),
  );
}

function requirementsProfileSource(
  input: Extract<DocumentInput, { family: "requirements-profile" }>,
): string {
  const showArgs = [
    `  position: ${keyed(input.position)}`,
    `  requirements: ${stringList(input.requirements)}`,
  ];
  const merits = input.merits.filter((v) => v.trim());
  if (merits.length > 0) showArgs.push(`  merits: ${stringList(merits)}`);
  if (input.mandate.mode === "year") {
    // Emit `year` explicitly so a saved draft means the same thing next year.
    showArgs.push(`  year: ${input.mandate.year}`);
  } else {
    const { from, to } = input.mandate;
    showArgs.push(
      `  mandate: (\n    from: date(${from.day}, ${from.month}, ${from.year}),\n    to: date(${to.day}, ${to.month}, ${to.year}),\n  )`,
    );
  }
  showArgs.push(...langDateArgs(input));
  return assemble(
    "requirements-profile",
    showArgs,
    [input.body.trim()].filter(Boolean),
  );
}

function nominationSource(
  input: Extract<DocumentInput, { family: "nomination" }>,
): string {
  const showArgs = [
    `  title: ${content(input.title)}`,
    `  meeting: ${content(input.meeting)}`,
    `  authors: ${authorsSource(input.authors)}`,
    `  candidates: ${candidatesSource(input.candidates)}`,
  ];
  if (input.statsEnabled && hasCompleteStats(input.candidates)) {
    showArgs.push(`  stats: ${statsSource(input.candidates)}`);
  }
  showArgs.push(...langDateArgs(input));
  return assemble(
    "nomination-proposal",
    showArgs,
    bodyWithYrkanden(input.body, input.yrkanden, input.lang),
  );
}

/** Build the full Typst source for a document of any family. */
export function buildDocumentSource(input: DocumentInput): string {
  switch (input.family) {
    case "deliberation":
      return deliberationSource(input);
    case "equal-treatment-plan":
      return equalTreatmentPlanSource(input);
    case "requirements-profile":
      return requirementsProfileSource(input);
    case "nomination":
      return nominationSource(input);
  }
}

// --- validation ------------------------------------------------------------

/** The required fields still missing, as user-facing labels. */
export function validateDocument(input: DocumentInput): string[] {
  const out: string[] = [];
  switch (input.family) {
    case "deliberation":
      if (!input.title.trim()) out.push(m.actic_missing_title());
      if (!input.meeting.trim()) out.push(m.actic_missing_meeting());
      if (!input.authors.some((a) => a.name.trim()))
        out.push(m.actic_missing_authors());
      break;
    case "equal-treatment-plan":
      if (!input.committee) out.push(m.actic_missing_committee());
      break;
    case "requirements-profile":
      if (!input.position) out.push(m.actic_missing_position());
      if (!input.requirements.some((r) => r.trim()))
        out.push(m.actic_missing_requirements());
      break;
    case "nomination":
      if (!input.title.trim()) out.push(m.actic_missing_title());
      if (!input.meeting.trim()) out.push(m.actic_missing_meeting());
      if (
        !input.candidates.some(
          (g) => g.position.trim() && g.nominees.some((n) => n.trim()),
        )
      )
        out.push(m.actic_missing_candidates());
      if (!input.authors.some((a) => a.name.trim()))
        out.push(m.actic_missing_authors());
      break;
  }
  return out;
}

/** Whether the document has enough content to be worth saving as a draft. */
export function hasDocumentContent(input: DocumentInput): boolean {
  switch (input.family) {
    case "deliberation":
      return !!(
        input.title.trim() ||
        input.meeting.trim() ||
        input.body.trim() ||
        input.authors.some((a) => a.name.trim())
      );
    case "equal-treatment-plan":
      return !!(input.committee || input.body.trim());
    case "requirements-profile":
      return !!(
        input.position ||
        input.requirements.some((v) => v.trim()) ||
        input.body.trim()
      );
    case "nomination":
      return !!(
        input.title.trim() ||
        input.meeting.trim() ||
        input.body.trim() ||
        input.candidates.length > 0
      );
  }
}

/** A short, filesystem-friendly slug for the download filename (no extension). */
export function documentSlug(input: DocumentInput): string {
  const keyedSlug = (value: KeyedValue | null) =>
    value ? slugify(value.kind === "key" ? value.path : value.value) : "";
  switch (input.family) {
    case "deliberation":
      return `${input.type}-${slugify(input.meeting)}-${slugify(input.title)}`;
    case "equal-treatment-plan":
      return `equal-treatment-plan-${keyedSlug(input.committee)}-${input.year}`;
    case "requirements-profile":
      return `kravprofil-${keyedSlug(input.position)}`;
    case "nomination":
      return `nomination-${slugify(input.meeting)}-${slugify(input.title)}`;
  }
}

/** A short, filesystem-friendly slug. */
export function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/\u0300-\u036f/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "dokument"
  );
}
