import { expect, test } from "vitest";
import {
  buildCatalog,
  findDocument,
  findManifestDocument,
  slugFromPath,
  titleFromPath,
} from "./governing";

test("manifest documents use their curated titles and groups", () => {
  const groups = buildCatalog([
    "stadgar.typ",
    "policyer/policy-for-val.typ",
    "riktlinjer/riktlinje-for-arkivering.typ",
  ]);
  expect(findDocument(groups, "policy-for-val")).toMatchObject({
    path: "policyer/policy-for-val.typ",
    title: "Policy för val",
    group: "policies",
  });
  expect(findDocument(groups, "stadgar")).toMatchObject({
    title: "Stadgar",
    group: "statutes",
  });
});

test("unmanifested files get a humanized title and a unique slug", () => {
  const groups = buildCatalog([
    "policyer/policy-for-nya-poster.typ",
    "policyer/policy-for-val.typ",
    "riktlinjer/policy-for-val.typ",
  ]);
  expect(findDocument(groups, "policy-for-nya-poster")?.title).toBe(
    "Policy för nya poster",
  );
  expect(findDocument(groups, "policy-for-val")?.path).toBe(
    "policyer/policy-for-val.typ",
  );
  expect(findDocument(groups, "policy-for-val-2")?.path).toBe(
    "riktlinjer/policy-for-val.typ",
  );
});

test("non-typst files are ignored", () => {
  expect(
    buildCatalog(["README.md", "gradle/wrapper.jar"]).flatMap(
      (g) => g.documents,
    ),
  ).toHaveLength(0);
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

test("findManifestDocument rejects unknown slugs", () => {
  expect(findManifestDocument("../../etc/passwd")).toBeUndefined();
  expect(findManifestDocument("policy-for-val")?.path).toBe(
    "policyer/policy-for-val.typ",
  );
});
