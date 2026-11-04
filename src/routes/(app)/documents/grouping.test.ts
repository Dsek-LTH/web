import { describe, expect, it } from "vitest";
import type { FileData } from "$lib/files/fileHandler";
import {
  findLatestFile,
  getColumnLayout,
  groupDocuments,
  splitDocumentPath,
} from "./grouping";

const file = (id: string, modDate?: Date): FileData => ({
  id,
  name: id.split("/").at(-1)!,
  modDate,
});

describe("splitDocumentPath", () => {
  it("parses a file directly in the meeting folder", () => {
    expect(
      splitDocumentPath("public/2026/HTM2/Kallelse.pdf", "public/2026/"),
    ).toEqual({ meeting: "HTM2", group: null });
  });

  it("parses a file inside a group folder", () => {
    expect(
      splitDocumentPath(
        "public/2026/HTM2/Fika på alla möten/Kallelse.pdf",
        "public/2026/",
      ),
    ).toEqual({ meeting: "HTM2", group: "Fika på alla möten" });
  });

  it("returns null for a file outside the prefix", () => {
    expect(
      splitDocumentPath("public/2025/HTM2/Kallelse.pdf", "public/2026/"),
    ).toBeNull();
  });
});

describe("groupDocuments", () => {
  it("groups files by meeting and group, with ungrouped files last", () => {
    const meetings = groupDocuments(
      [
        file("public/2026/HTM2/Zeta/Zeta.pdf"),
        file("public/2026/HTM2/Alpha/Alpha.pdf"),
        file("public/2026/HTM2/Kallelse.pdf"),
      ],
      "public/2026/",
    );

    expect(meetings).toHaveLength(1);
    expect(meetings[0]!.name).toBe("HTM2");
    expect(meetings[0]!.groups.map((group) => group.name)).toEqual([
      "Alpha",
      "Zeta",
      null,
    ]);
    expect(meetings[0]!.files).toHaveLength(3);
  });

  it("keeps old SRD files as filename-based meetings", () => {
    const meetings = groupDocuments(
      [
        file("public/srd/2026/Möte 1.pdf"),
        file("public/srd/2026/SRD10/Motion 1/Motion_1.pdf"),
      ],
      "public/srd/2026/",
      { oldSrdFormat: true },
    );

    expect(meetings.map((meeting) => meeting.name)).toEqual([
      "Möte 1",
      "SRD10",
    ]);
    expect(meetings[1]!.groups[0]!.name).toBe("Motion 1");
  });

  it("skips directory entries", () => {
    const meetings = groupDocuments(
      [{ id: "public/2026/HTM2/", name: "HTM2", isDir: true }],
      "public/2026/",
    );

    expect(meetings).toEqual([]);
  });
});

describe("findLatestFile", () => {
  it("returns the newest file matching any prefix", () => {
    const older = file(
      "public/2026/HTM2/Kallelse_old.pdf",
      new Date("2026-01-01"),
    );
    const newer = file(
      "public/2026/HTM2/Notice_new.pdf",
      new Date("2026-02-01"),
    );

    expect(findLatestFile([older, newer], ["Kallelse", "Notice"])).toBe(newer);
  });

  it("returns undefined when nothing matches", () => {
    expect(findLatestFile([file("Protokoll.pdf")], ["Kallelse"])).toBe(
      undefined,
    );
  });
});

describe("getColumnLayout", () => {
  it("fills the first column before starting the next", () => {
    expect(getColumnLayout(3, 608, 280, 14)).toEqual({ columns: 2, rows: 2 });
    expect(getColumnLayout(10, 608, 280, 14)).toEqual({ columns: 2, rows: 5 });
  });

  it("uses more columns when the width allows it", () => {
    expect(getColumnLayout(3, 970, 280, 14)).toEqual({ columns: 3, rows: 1 });
  });

  it("falls back to one column", () => {
    expect(getColumnLayout(3, 340, 280, 14)).toEqual({ columns: 1, rows: 3 });
  });
});
