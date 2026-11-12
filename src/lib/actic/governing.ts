export type GoverningGroupId =
  | "statutes"
  | "regulations"
  | "strategic-goals"
  | "policies"
  | "guidelines";

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

export const GOVERNING_MANIFEST = [
  { path: "stadgar.typ", title: "Stadgar", group: "statutes" },
  { path: "reglemente.typ", title: "Reglemente", group: "regulations" },
  {
    path: "strategiska-mal.typ",
    title: "Strategiska mål",
    group: "strategic-goals",
  },
  {
    path: "policyer/policy-for-alkohol-och-droger.typ",
    title: "Policy för alkohol och droger",
    group: "policies",
  },
  {
    path: "policyer/policy-for-ekonomi.typ",
    title: "Policy för ekonomi",
    group: "policies",
  },
  {
    path: "policyer/policy-for-hantering-av-nya-poster.typ",
    title: "Policy för hantering av nya poster",
    group: "policies",
  },
  {
    path: "policyer/policy-for-hantering-av-personuppgifter.typ",
    title: "Policy för hantering av personuppgifter",
    group: "policies",
  },
  {
    path: "policyer/policy-for-jamlikhet.typ",
    title: "Policy för jämlikhet",
    group: "policies",
  },
  {
    path: "policyer/policy-for-motestider.typ",
    title: "Policy för mötestider",
    group: "policies",
  },
  {
    path: "policyer/policy-for-samverkan-med-dchip.typ",
    title: "Policy för samverkan med D-Chip",
    group: "policies",
  },
  {
    path: "policyer/policy-for-sektionsbil.typ",
    title: "Policy för sektionsbil",
    group: "policies",
  },
  {
    path: "policyer/policy-for-styrdokument.typ",
    title: "Policy för styrdokument",
    group: "policies",
  },
  {
    path: "policyer/policy-for-tackverksamhet.typ",
    title: "Policy för tackverksamhet",
    group: "policies",
  },
  {
    path: "policyer/policy-for-val.typ",
    title: "Policy för val",
    group: "policies",
  },
  {
    path: "policyer/policy-for-valberedningsarbete.typ",
    title: "Policy för valberedningsarbete",
    group: "policies",
  },
  {
    path: "riktlinjer/krishanteringsplan.typ",
    title: "Krishanteringsplan",
    group: "guidelines",
  },
  {
    path: "riktlinjer/riktlinje-for-anmodanden-och-inbjudningar.typ",
    title: "Riktlinje för anmodanden och inbjudningar",
    group: "guidelines",
  },
  {
    path: "riktlinjer/riktlinje-for-arkivering.typ",
    title: "Riktlinje för arkivering",
    group: "guidelines",
  },
  {
    path: "riktlinjer/riktlinje-for-grafisk-profil.typ",
    title: "Riktlinje för grafisk profil",
    group: "guidelines",
  },
  {
    path: "riktlinjer/riktlinje-for-internationalisering.typ",
    title: "Riktlinje för internationalisering",
    group: "guidelines",
  },
  {
    path: "riktlinjer/riktlinje-for-marknadsforing-och-prissattning.typ",
    title: "Riktlinje för marknadsföring och prissättning",
    group: "guidelines",
  },
  {
    path: "riktlinjer/riktlinje-for-overlamning.typ",
    title: "Riktlinje för överlämning",
    group: "guidelines",
  },
  {
    path: "riktlinjer/riktlinje-for-sektionsbilens-anvandning.typ",
    title: "Riktlinje för sektionsbilens användning",
    group: "guidelines",
  },
  {
    path: "riktlinjer/riktlinje-for-utmarkelsen-DuCtig.typ",
    title: "Riktlinje för utmärkelsen DuCtig",
    group: "guidelines",
  },
] as const;

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

export function buildCatalog(paths: string[]): GoverningGroup[] {
  const unique = [...new Set(paths.filter((path) => path.endsWith(".typ")))];
  const used = new Set<string>();
  const documents: GoverningDocument[] = [];

  for (const path of unique) {
    const manifest = GOVERNING_MANIFEST.find((entry) => entry.path === path);
    const base = slugFromPath(path);
    let slug = base;
    let suffix = 2;
    while (used.has(slug)) slug = `${base}-${suffix++}`;
    used.add(slug);
    documents.push({
      slug,
      path,
      title: manifest?.title ?? titleFromPath(path),
      group: manifest?.group ?? groupFromPath(path),
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

export function findManifestDocument(
  slug: string,
): GoverningDocument | undefined {
  const manifest = GOVERNING_MANIFEST.find(
    (entry) => slugFromPath(entry.path) === slug,
  );
  if (!manifest) return undefined;
  return {
    slug,
    path: manifest.path,
    title: manifest.title,
    group: manifest.group,
  };
}
