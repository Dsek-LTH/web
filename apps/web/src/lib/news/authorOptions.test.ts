import { describe, expect, it } from "vitest";
import { buildAuthorOptions, toAuthorInput } from "./authorOptions";

const self = { id: "member-1", studentId: "ab1234cd-s" };

describe("toAuthorInput", () => {
  it("sends the mandate id, not the position id, for a mandate byline", () => {
    const [, mandateOption] = buildAuthorOptions(
      self,
      [
        {
          id: "11111111-1111-1111-1111-111111111111",
          position: {
            id: "dsek.cafe.mastare",
            name: "Café-mästare",
            nameSv: "Café-mästare",
          },
        },
      ],
      [],
    );
    expect(toAuthorInput(mandateOption!)).toEqual({
      mandateId: "11111111-1111-1111-1111-111111111111",
    });
  });

  it("sends the custom author id for a custom byline", () => {
    const [, customOption] = buildAuthorOptions(
      self,
      [],
      [{ id: "custom-1", name: "Styrelsen", nameSv: "Styrelsen" }],
    );
    expect(toAuthorInput(customOption!)).toEqual({ customId: "custom-1" });
  });

  it("sends nothing for posting as oneself", () => {
    const [memberOption] = buildAuthorOptions(self, [], []);
    expect(toAuthorInput(memberOption!)).toEqual({});
  });
});
