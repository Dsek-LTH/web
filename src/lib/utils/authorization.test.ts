import { expect, test } from "vitest";
import { getDerivedRoles } from "./authorization";

test("signed out user", () => {
  expect(getDerivedRoles()).toEqual(["*"]);
});

test("signed in user with no groups", () => {
  expect(getDerivedRoles([], true)).toEqual(["*", "_"]);
});

test("signed in user with one simple group", () => {
  expect(getDerivedRoles(["group"])).toEqual(["group", "*", "_"]);
});

test("signed in user with complex groups", () => {
  expect(getDerivedRoles(["dsek.infu.mdlm", "dsek.ordf"])).toEqual([
    "dsek",
    "dsek.infu",
    "dsek.infu.mdlm",
    "dsek.ordf",
    "*",
    "_",
  ]);
});
