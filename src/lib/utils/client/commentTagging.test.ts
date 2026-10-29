import { describe, expect, test } from "vitest";
import { getMentionText, replaceCommentTags } from "./commentTagging";

const member = {
  studentId: "ad1234lo-s",
  firstName: "Ada",
  lastName: "Lovelace",
  nickname: null,
};

describe("replaceCommentTags", () => {
  test("uses the member's current name", () => {
    expect(
      replaceCommentTags("[@Old Name](/members/ad1234lo-s)", [member]),
    ).toBe("[@Ada Lovelace](/members/ad1234lo-s)");
  });

  test("keeps the stored name when the member cannot be found", () => {
    expect(
      replaceCommentTags("[@Old Name](/members/mi9999ng-s)", [member]),
    ).toBe("[@Old Name](/members/mi9999ng-s)");
  });

  test("leaves comments without tags unchanged", () => {
    expect(replaceCommentTags("Hello there!", [member])).toBe("Hello there!");
  });
});

describe("getMentionText", () => {
  test("creates a member tag with a trailing space", () => {
    expect(getMentionText(member)).toBe(
      "[@Ada Lovelace](/members/ad1234lo-s) ",
    );
  });
});
