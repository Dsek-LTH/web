import type {
  GoverningDocument,
  GoverningGroup,
  GoverningGroupId,
} from "$lib/actic/governing";

/** The landing page's governing-document groups, as presented. */
export type DiffGroupId = "overview" | "policies" | "guidelines";

export type DiffGroupView = {
  id: DiffGroupId;
  docs: GoverningDocument[];
};

/**
 * How the catalog's groups are presented: the constitutional documents
 * (statutes, regulations, strategic goals) read as one "overarching" group,
 * while policies and guidelines stand on their own.
 */
const DISPLAY_GROUPS: Array<{ id: DiffGroupId; sources: GoverningGroupId[] }> =
  [
    { id: "overview", sources: ["statutes", "regulations", "strategic-goals"] },
    { id: "policies", sources: ["policies"] },
    { id: "guidelines", sources: ["guidelines"] },
  ];

/**
 * The portal's groups for the page: catalog documents collected into the
 * display groups, in display order, with empty groups left out.
 */
export function diffGroupViews(catalog: GoverningGroup[]): DiffGroupView[] {
  return DISPLAY_GROUPS.flatMap(({ id, sources }) => {
    const docs = catalog
      .filter((group) => sources.includes(group.id))
      .flatMap((group) => group.documents);
    return docs.length > 0 ? [{ id, docs }] : [];
  });
}
