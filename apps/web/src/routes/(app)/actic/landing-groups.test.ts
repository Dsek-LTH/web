import { expect, test } from "vitest";
import { diffGroupViews } from "./landing-groups";

const catalog = [
  {
    id: "statutes",
    documents: [{ slug: "stadgar", title: "Stadgar" }],
  },
  {
    id: "regulations",
    documents: [{ slug: "reglemente", title: "Reglemente" }],
  },
  {
    id: "strategic-goals",
    documents: [{ slug: "mal", title: "Strategiska mål" }],
  },
  {
    id: "policies",
    documents: [
      { slug: "policy-for-val", title: "Policy för val" },
      { slug: "policy-b", title: "Policy B" },
    ],
  },
  { id: "guidelines", documents: [] },
] as Parameters<typeof diffGroupViews>[0];

test("statutes, regulations and strategic goals merge into one overview group", () => {
  const views = diffGroupViews(catalog);
  const overview = views.find((v) => v.id === "overview")!;
  expect(overview.docs.map((d) => d.slug)).toEqual([
    "stadgar",
    "reglemente",
    "mal",
  ]);
});

test("policies stay their own group", () => {
  const views = diffGroupViews(catalog);
  const policies = views.find((v) => v.id === "policies")!;
  expect(policies.docs.map((d) => d.slug)).toEqual([
    "policy-for-val",
    "policy-b",
  ]);
});

test("empty groups are omitted", () => {
  const views = diffGroupViews(catalog);
  expect(views.find((v) => v.id === "guidelines")).toBeUndefined();
  expect(views.map((v) => v.id)).toEqual(["overview", "policies"]);
});
