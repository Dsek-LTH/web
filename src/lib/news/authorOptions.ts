import type { AuthorOptionSchema } from "$lib/news/schema";
import type { components } from "$lib/api/schema";

type Member = components["schemas"]["Member"];
type Mandate = components["schemas"]["Mandate"];
type CustomAuthor = components["schemas"]["CustomAuthor"];

/**
 * Which author identities a member can publish as: themselves, one of
 * their currently-active mandates, or a custom byline they manage. Pure
 * function of already-fetched data so it can be called from `+page.ts`
 * (both create and edit load their own mandates/custom-authors from the
 * Go API - see backend's `/members/{id}/mandates` and `/custom-authors`).
 */
export function buildAuthorOptions(
  self: Member,
  mandates: Mandate[],
  customAuthors: CustomAuthor[],
): AuthorOptionSchema[] {
  return [
    { type: "Member", member: self },
    ...mandates.map((mandate) => ({
      type: "Mandate",
      member: self,
      position: mandate.position,
    })),
    ...customAuthors.map((customAuthor) => ({
      type: "Custom",
      member: self,
      customAuthor,
    })),
  ];
}

export function sameAuthorOption(
  a: AuthorOptionSchema,
  b: AuthorOptionSchema,
): boolean {
  return (
    a.type === b.type &&
    a.member.id === b.member.id &&
    a.position?.id === b.position?.id &&
    a.customAuthor?.id === b.customAuthor?.id
  );
}

/** Reduces a picked option to the `{mandateId?, customId?}` the Go API's
 * AuthorInput wants - the member is always resolved server-side from the
 * acting identity, never sent explicitly. */
export function toAuthorInput(
  author: AuthorOptionSchema,
): { mandateId?: string; customId?: string } {
  if (author.type === "Mandate") return { mandateId: author.position?.id };
  if (author.type === "Custom")
    return { customId: author.customAuthor?.id };
  return {};
}
