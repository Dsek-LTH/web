export type GoverningGroupId =
  "statutes" | "regulations" | "strategic-goals" | "policies" | "guidelines";

export type GoverningDocument = {
  slug: string;
  path: string;
  title: string;
  group: GoverningGroupId;
};

export type GoverningGroup = {
  id: GoverningGroupId;
  documents: GoverningDocument[];
};

export const GOVERNING_GROUPS: readonly GoverningGroupId[] = [
  "statutes",
  "regulations",
  "strategic-goals",
  "policies",
  "guidelines",
];

function basename(path: string): string {
  return path.split("/").pop() ?? path;
}

function words(value: string): string {
  return value.replace(/[_-]+/g, " ").trim();
}

export function slugFromPath(path: string): string {
  return basename(path)
    .replace(/\.typ$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function titleFromPath(path: string): string {
  const base = basename(path).replace(/\.typ$/, "");
  const folder = path.split("/")[0];
  if (folder === "policyer" && base.startsWith("policy-for-")) {
    return `Policy för ${words(base.slice("policy-for-".length))}`;
  }
  if (folder === "riktlinjer" && base.startsWith("riktlinje-for-")) {
    return `Riktlinje för ${words(base.slice("riktlinje-for-".length))}`;
  }
  const title = words(base);
  return title.charAt(0).toUpperCase() + title.slice(1);
}

function groupFromPath(path: string): GoverningGroupId {
  const folder = path.split("/")[0];
  if (folder === "policyer") return "policies";
  if (folder === "riktlinjer") return "guidelines";
  const base = basename(path).replace(/\.typ$/, "");
  if (base === "stadgar") return "statutes";
  if (base === "reglemente") return "regulations";
  if (base === "strategiska-mal") return "strategic-goals";
  return "policies";
}

/**
 * Titles as the dsek package renders them: fixed per wrapper for the
 * constitutional documents, prefix + subject for policies/guidelines —
 * or just the subject when the document opts into a cover page
 * (`use-cover-page: true`).
 */
export function describeGoverningDocument(
  path: string,
  head: string,
): { title: string | null; group: GoverningGroupId } {
  const wrapper = /#show:\s*([a-zA-Z-]+)/.exec(head)?.[1];
  const subject = /subject:\s*"([^"]+)"/.exec(head)?.[1];
  const coverPage = /use-cover-page:\s*true/.test(head);

  if (wrapper === "statutes") return { title: "Stadgar", group: "statutes" };
  if (wrapper === "regulations") {
    return { title: "Reglemente", group: "regulations" };
  }
  if (wrapper === "strategic-goals") {
    return { title: "Strategiska mål", group: "strategic-goals" };
  }
  if (wrapper === "policy" && subject) {
    return {
      title: coverPage ? subject : `Policy för ${subject}`,
      group: "policies",
    };
  }
  if (wrapper === "guideline" && subject) {
    return {
      title: coverPage ? subject : `Riktlinje för ${subject}`,
      group: "guidelines",
    };
  }
  return { title: null, group: groupFromPath(path) };
}

export function buildCatalog(
  entries: Array<{ path: string; head: string }>,
): GoverningGroup[] {
  // Dedupe by path; the last entry for a path wins.
  const heads = new Map<string, string>();
  for (const entry of entries) {
    if (entry.path.endsWith(".typ")) heads.set(entry.path, entry.head);
  }
  const used = new Set<string>();
  const documents: GoverningDocument[] = [];

  for (const [path, head] of heads) {
    const described = describeGoverningDocument(path, head);
    const base = slugFromPath(path);
    let slug = base;
    let suffix = 2;
    while (used.has(slug)) slug = `${base}-${suffix++}`;
    used.add(slug);
    documents.push({
      slug,
      path,
      title: described.title ?? titleFromPath(path),
      group: described.group,
    });
  }

  return GOVERNING_GROUPS.map((id) => ({
    id,
    documents: documents
      .filter((document) => document.group === id)
      .sort((a, b) => a.title.localeCompare(b.title, "sv")),
  }));
}

export function findDocument(
  groups: GoverningGroup[],
  slug: string,
): GoverningDocument | undefined {
  return groups
    .flatMap((group) => group.documents)
    .find((document) => document.slug === slug);
}
