import { describe, expect, test } from "vitest";
import { fuseEmail, isValidGuildEmail, splitEmail } from "./emailutils";

describe("splitEmail", () => {
  test("returns null for invalid email", () => {
    const email = "";
    const result = splitEmail(email);
    expect(result).toBe(null);
  });

  test("returns null for email without @", () => {
    const email = "test";
    const result = splitEmail(email);
    expect(result).toBe(null);
  });

  test("returns null for email with multiple @", () => {
    const email = "test@test@test.se";
    const result = splitEmail(email);
    expect(result).toBe(null);
  });

  test("returns correct result for valid email", () => {
    let email = "ordforande@dsek.se";
    let result = splitEmail(email);
    expect(result).toEqual({
      localPart: "ordforande",
      domain: "dsek.se",
    });

    email = "ProjektgruppenTeknikfokus@dsek.se";
    result = splitEmail(email);
    expect(result).toEqual({
      localPart: "ProjektgruppenTeknikfokus",
      domain: "dsek.se",
    });

    email = "accounting@teknikfokus.se";
    result = splitEmail(email);
    expect(result).toEqual({
      localPart: "accounting",
      domain: "teknikfokus.se",
    });

    email = "abc@teknikfokus.se";
    result = splitEmail(email);
    expect(result).toEqual({
      localPart: "abc",
      domain: "teknikfokus.se",
    });

    email = "abc@nolla.nu";
    result = splitEmail(email);
    expect(result).toEqual({
      localPart: "abc",
      domain: "nolla.nu",
    });

    email = "abc@geekend.se";
    result = splitEmail(email);
    expect(result).toEqual({
      localPart: "abc",
      domain: "geekend.se",
    });

    email = "yrka@yrka.nu";
    result = splitEmail(email);
    expect(result).toEqual({
      localPart: "yrka",
      domain: "yrka.nu",
    });

    email = "abc@juble.se";
    result = splitEmail(email);
    expect(result).toEqual({
      localPart: "abc",
      domain: "juble.se",
    });
  });
});

describe("fuseEmail", () => {
  test("returns correct result", () => {
    const email = {
      localPart: "abc",
      domain: "dsek.se",
    };
    const result = fuseEmail(email);
    expect(result).toBe("abc@dsek.se");
  });
  test("returns correct result for email with @", () => {
    const email = {
      localPart: "abc@",
      domain: "dsek.se",
    };
    const result = fuseEmail(email);
    expect(result).toBe("abc@dsek.se");
  });
  test("returns correct result for domain with @", () => {
    const email = {
      localPart: "abc",
      domain: "@dsek.se",
    };
    const result = fuseEmail(email);
    expect(result).toBe("abc@dsek.se");
  });
  test("returns correct result for email with multiple @", () => {
    const email = {
      localPart: "abc@",
      domain: "@dsek.se",
    };
    const result = fuseEmail(email);
    expect(result).toBe("abc@dsek.se");
  });
  test("strip whitespace", () => {
    const email = {
      localPart: " abc ",
      domain: " dsek.se ",
    };
    const result = fuseEmail(email);
    expect(result).toBe("abc@dsek.se");
  });
  test("strip whitespace and @", () => {
    const email = {
      localPart: " abc@ ",
      domain: " @dsek.se ",
    };
    const result = fuseEmail(email);
    expect(result).toBe("abc@dsek.se");
  });
});

describe("isValidGuildEmail", () => {
  test("returns false for invalid email", () => {
    const email = "test";
    const result = isValidGuildEmail(email);
    expect(result).toBe(false);
  });

  test("returns false for email without @", () => {
    const email = "test";
    const result = isValidGuildEmail(email);
    expect(result).toBe(false);
  });

  test("returns false for email with multiple @", () => {
    const email = "test@test@test.se";
    const result = isValidGuildEmail(email);
    expect(result).toBe(false);
  });

  test("returns false for email with invalid domain", () => {
    const email = "xxxx@xxxxxxx";
    const result = isValidGuildEmail(email);
    expect(result).toBe(false);
  });

  test("returns false for email with invalid local part", () => {
    let email = "@dsek.se";
    let result = isValidGuildEmail(email);
    expect(result).toBe(false);

    email = "abc@";
    result = isValidGuildEmail(email);
    expect(result).toBe(false);

    email = "@";
    result = isValidGuildEmail(email);
    expect(result).toBe(false);

    email = "abc@abc@dsek.se";
    result = isValidGuildEmail(email);
    expect(result).toBe(false);

    email = '"abc"@dsek.se';
    result = isValidGuildEmail(email);
    expect(result).toBe(false);
  });

  test("returns true for valid email", () => {
    let email = "abc@dsek.se";
    let result = isValidGuildEmail(email);
    expect(result).toBe(true);

    email = "abc@nolla.nu";
    result = isValidGuildEmail(email);
    expect(result).toBe(true);

    email = "abc@yrka.nu";
    result = isValidGuildEmail(email);
    expect(result).toBe(true);

    email = "abc@teknikfokus.se";
    result = isValidGuildEmail(email);
    expect(result).toBe(true);

    email = "abc@juble.se";
    result = isValidGuildEmail(email);
    expect(result).toBe(true);

    email = "abc@geekend.se";
    result = isValidGuildEmail(email);
    expect(result).toBe(true);
  });

  test("returns false for empty email", () => {
    const email = "";
    const result = isValidGuildEmail(email);
    expect(result).toBe(false);
  });
});
