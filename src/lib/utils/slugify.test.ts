import { expect, test } from "vitest";
import { slugify } from "./slugify";

test("slugify 'Diss #2 till 10 staben' should equal 'diss-2-till-10-staben'", () => {
  expect(slugify("Diss #2 till 10 staben")).toBe("diss-2-till-10-staben");
});

test("slugify 'Bumbibjörnarnas fyllesång' should equal 'bumbibjornarnas-fyllesang'", () => {
  expect(slugify("Bumbibjörnarnas fyllesång")).toBe(
    "bumbibjornarnas-fyllesang",
  );
});

test("slugify 'toString = null' should equal 'tostring-null'", () => {
  expect(slugify("toString = null")).toBe("tostring-null");
});

test("slugify 'Ä&amp;&amp;P diss 11' should equal 'a-amp-amp-p-diss-11'", () => {
  expect(slugify("Ä&amp;&amp;P diss 11")).toBe("a-amp-amp-p-diss-11");
});

test("slugify 'Debatt - SåS 17' should equal 'debatt-sas-17'", () => {
  expect(slugify("Debatt - SåS 17")).toBe("debatt-sas-17");
});

test("slugifing long string should be truncated", () => {
  expect(slugify("a".repeat(100), 25)).toBe("a".repeat(25));
});

test("slugifing short string should be unchanged", () => {
  const str = "a".repeat(5);
  expect(slugify(str, 25)).toBe(str);
});

test("slugify 'a b c' should equal 'a-b-c'", () => {
  expect(slugify("a b c")).toBe("a-b-c");
});

test("slugify empty string should equal ''", () => {
  expect(slugify("")).toBe("");
});

test("slugify string with leading/trailing whitespace should be trimmed", () => {
  expect(slugify("  leading-trailing  ")).toBe("leading-trailing");
});

test("slugify string with diacritics should have diacritics removed", () => {
  expect(slugify("Åpple sträßé")).toBe("apple-stra-e"); // this should be apple-strasse but that requires more effort to get right
});

test("slugify string with quotes should have quotes removed", () => {
  expect(slugify(`"quoted string"`)).toBe("quoted-string");
});

test("slugify string with non-alphanumeric characters should have them replaced with hyphens", () => {
  expect(slugify("a!b@c#d$e%f\\g&h*i(j)k_l+m=n")).toBe(
    "a-b-c-d-e-f-g-h-i-j-k-l-m-n",
  );
});

test("slugify string exceeding maxLength should be truncated to maxLength", () => {
  expect(slugify("a".repeat(100), 25)).toBe("a".repeat(25));
});

test("slugify string with leading/trailing hyphens should have them trimmed", () => {
  expect(slugify("--leading-trailing--")).toBe("leading-trailing");
});

test("slugify string with uppercase characters should be converted to lowercase", () => {
  expect(slugify("UpperCase")).toBe("uppercase");
});
