import { expect, test } from "vitest";
import {
  buildCatalog,
  describeGoverningDocument,
  findDocument,
  slugFromPath,
  titleFromPath,
} from "./governing";

const POLICY_HEAD = `#import "@preview/dsek:0.1.0": *

#show: policy.with(
  subject: "ekonomi",
  summary: [
    Policyn beskriver hur sektionen ska arbeta med ekonomi.
  ],
)
`;

const GUIDELINE_HEAD = `#import "@preview/dsek:0.1.0": *

#show: guideline.with(
  subject: "arkivering",
  summary: [
    Denna riktlinje ger direktiv kring arkivering.
  ],
)
`;

const COVER_PAGE_HEAD = `#import "@preview/dsek:0.1.0": *

#show: guideline.with(
  subject: "Krishanteringsplan",
  use-cover-page: true,
)
`;

test("policy documents get their title from the subject param", () => {
  const described = describeGoverningDocument(
    "policyer/policy-for-ekonomi.typ",
    POLICY_HEAD,
  );
  expect(described).toEqual({ title: "Policy för ekonomi", group: "policies" });
});

test("guideline documents get their title from the subject param", () => {
  const described = describeGoverningDocument(
    "riktlinjer/riktlinje-for-arkivering.typ",
    GUIDELINE_HEAD,
  );
  expect(described).toEqual({
    title: "Riktlinje för arkivering",
    group: "guidelines",
  });
});

test("a cover page drops the policy/guideline prefix", () => {
  const described = describeGoverningDocument(
    "riktlinjer/krishanteringsplan.typ",
    COVER_PAGE_HEAD,
  );
  expect(described).toEqual({
    title: "Krishanteringsplan",
    group: "guidelines",
  });
});

test("wrapper-only documents use the fixed title", () => {
  expect(
    describeGoverningDocument("stadgar.typ", "#show: statutes\n= Sektionen\n"),
  ).toEqual({ title: "Stadgar", group: "statutes" });
  expect(
    describeGoverningDocument(
      "reglemente.typ",
      "#show: regulations\n= Teknologia\n",
    ),
  ).toEqual({ title: "Reglemente", group: "regulations" });
  expect(
    describeGoverningDocument(
      "strategiska-mal.typ",
      "#show: strategic-goals.with(\n  summary: [Mål],\n)\n",
    ),
  ).toEqual({ title: "Strategiska mål", group: "strategic-goals" });
});

test("an unparseable head falls back to path-derived title and group", () => {
  expect(
    describeGoverningDocument(
      "policyer/policy-for-ny-policy.typ",
      "#show: policy.with(\n",
    ),
  ).toEqual({ title: null, group: "policies" });
  expect(describeGoverningDocument("ovrigt/nagot-annat.typ", "")).toEqual({
    title: null,
    group: "policies",
  });
});

test("the catalog builds documents from tree paths and source heads", () => {
  const groups = buildCatalog([
    { path: "stadgar.typ", head: "#show: statutes\n" },
    {
      path: "policyer/policy-for-val.typ",
      head: POLICY_HEAD.replace('subject: "ekonomi"', 'subject: "val"'),
    },
    {
      path: "policyer/policy-for-nya-poster.typ",
      head: "",
    },
  ]);
  expect(findDocument(groups, "policy-for-val")).toMatchObject({
    title: "Policy för val",
    group: "policies",
  });
  expect(findDocument(groups, "stadgar")).toMatchObject({
    title: "Stadgar",
    group: "statutes",
  });
  // Without a readable head the path-derived fallback applies.
  expect(findDocument(groups, "policy-for-nya-poster")?.title).toBe(
    "Policy för nya poster",
  );
});

test("non-typst files are ignored and slugs stay unique", () => {
  const groups = buildCatalog([
    { path: "README.md", head: "" },
    { path: "policyer/policy-for-val.typ", head: POLICY_HEAD },
    { path: "riktlinjer/policy-for-val.typ", head: GUIDELINE_HEAD },
  ]);
  const documents = groups.flatMap((g) => g.documents);
  expect(documents).toHaveLength(2);
  expect(findDocument(groups, "policy-for-val")?.path).toBe(
    "policyer/policy-for-val.typ",
  );
  expect(findDocument(groups, "policy-for-val-2")?.path).toBe(
    "riktlinjer/policy-for-val.typ",
  );
});

test("slugFromPath lowercases the basename", () => {
  expect(slugFromPath("riktlinjer/riktlinje-for-utmarkelsen-DuCtig.typ")).toBe(
    "riktlinje-for-utmarkelsen-ductig",
  );
});

test("titleFromPath fallback prefixes the folder's document kind", () => {
  expect(titleFromPath("riktlinjer/riktlinje-for-ny-riktlinje.typ")).toBe(
    "Riktlinje för ny riktlinje",
  );
});
