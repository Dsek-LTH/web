import { describe, expect, it } from "vitest";
import type { FileData } from "$lib/files/fileHandler";
import {
  findLatestFile,
  getMeetingFileKey,
  getMeetingFolder,
  groupDocuments,
  mergeMeetings,
  splitDocumentPath,
} from "./grouping";

const file = (id: string, modDate?: Date): FileData => ({
  id,
  name: id.split("/").at(-1)!,
  modDate,
  bucket: "documents",
});

describe("splitDocumentPath", () => {
  it("parses the meeting from a flat file path", () => {
    expect(
      splitDocumentPath("public/2026/HTM2/Kallelse.pdf", "public/2026/"),
    ).toEqual({ meeting: "HTM2" });
  });

  it("ignores legacy group folders in the path", () => {
    expect(
      splitDocumentPath(
        "public/2026/HTM2/Fika på alla möten/Kallelse.pdf",
        "public/2026/",
      ),
    ).toEqual({ meeting: "HTM2" });
  });

  it("returns null for a file outside the prefix", () => {
    expect(
      splitDocumentPath("public/2025/HTM2/Kallelse.pdf", "public/2026/"),
    ).toBeNull();
  });
});

describe("getMeetingFileKey", () => {
  it("returns the path relative to the meeting folder", () => {
    expect(
      getMeetingFileKey(
        "public/2026/HTM2/Folder/Motion.pdf",
        "public/2026/HTM2",
      ),
    ).toBe("Folder/Motion.pdf");
  });
});

describe("groupDocuments", () => {
  it("groups files from the group map, with ungrouped files last", () => {
    const meetings = groupDocuments(
      [
        file("public/2026/HTM2/Zeta.pdf"),
        file("public/2026/HTM2/Alpha.pdf"),
        file("public/2026/HTM2/Kallelse.pdf"),
      ],
      "public/2026/",
      {
        groupMaps: {
          HTM2: { "Zeta.pdf": "Zeta", "Alpha.pdf": "Alpha" },
        },
      },
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

  it("keys nested legacy files by their path inside the meeting", () => {
    const meetings = groupDocuments(
      [
        file("public/2026/HTM2/Folder A/Motion.pdf"),
        file("public/2026/HTM2/Folder B/Motion.pdf"),
      ],
      "public/2026/",
      {
        groupMaps: {
          HTM2: {
            "Folder A/Motion.pdf": "Group A",
            "Folder B/Motion.pdf": "Group B",
          },
        },
      },
    );

    expect(
      meetings[0]!.groups.map((group) => [group.name, group.files[0]!.id]),
    ).toEqual([
      ["Group A", "public/2026/HTM2/Folder A/Motion.pdf"],
      ["Group B", "public/2026/HTM2/Folder B/Motion.pdf"],
    ]);
  });

  it("keeps old SRD files as filename-based meetings", () => {
    const meetings = groupDocuments(
      [
        file("public/srd/2026/Möte 1.pdf"),
        file("public/srd/2026/SRD10/Motion_1.pdf"),
      ],
      "public/srd/2026/",
      {
        oldSrdFormat: true,
        groupMaps: {
          SRD10: { "Motion_1.pdf": "Motion 1" },
        },
      },
    );

    expect(meetings.map((meeting) => meeting.name)).toEqual([
      "Möte 1",
      "SRD10",
    ]);
    expect(meetings[1]!.groups[0]!.name).toBe("Motion 1");
  });

  it("falls back to a filename meeting when a folder is not a valid SRD meeting", () => {
    const meetings = groupDocuments(
      [file("public/srd/2026/Random/Motion.pdf")],
      "public/srd/2026/",
      {
        oldSrdFormat: true,
        meetingFilter: (name) =>
          name.startsWith("SRD") || name.startsWith("Möte"),
      },
    );

    expect(meetings.map((meeting) => meeting.name)).toEqual(["Motion"]);
  });

  it("sorts files inside each group alphabetically", () => {
    const meetings = groupDocuments(
      [
        file("public/2026/HTM2/Fika/B.pdf"),
        file("public/2026/HTM2/Fika/A.pdf"),
      ],
      "public/2026/",
      {
        groupMaps: {
          HTM2: { "A.pdf": "Fika", "B.pdf": "Fika" },
        },
      },
    );

    expect(meetings[0]!.groups[0]!.files.map((entry) => entry.name)).toEqual([
      "A.pdf",
      "B.pdf",
    ]);
  });

  it("skips directory entries", () => {
    const meetings = groupDocuments(
      [
        {
          id: "public/2026/HTM2/",
          name: "HTM2",
          isDir: true,
          bucket: "documents",
        },
      ],
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

describe("mergeMeetings", () => {
  it("sorts files again after merging groups", () => {
    const documents = groupDocuments(
      [file("public/2026/Möte 1/A.pdf"), file("public/2026/Möte 1/C.pdf")],
      "public/2026/",
      {
        groupMaps: {
          "Möte 1": { "A.pdf": "Group", "C.pdf": "Group" },
        },
      },
    );
    const srd = groupDocuments(
      [
        file("public/srd/2026/Möte 1/B.pdf"),
        file("public/srd/2026/Möte 1/D.pdf"),
      ],
      "public/srd/2026/",
      {
        groupMaps: {
          "Möte 1": { "B.pdf": "Group", "D.pdf": "Group" },
        },
      },
    );

    const merged = mergeMeetings([...documents, ...srd]);

    expect(merged[0]!.groups[0]!.files.map((entry) => entry.name)).toEqual([
      "A.pdf",
      "B.pdf",
      "C.pdf",
      "D.pdf",
    ]);
  });
});

describe("getMeetingFolder", () => {
  it("finds the meeting folder in the documents bucket", () => {
    expect(
      getMeetingFolder(
        "public/2026/HTM2/Fika/Motion.pdf",
        "documents",
        "documents",
        "files",
      ),
    ).toBe("public/2026/HTM2");
  });

  it("finds the meeting folder in the SRD files bucket", () => {
    expect(
      getMeetingFolder(
        "public/srd/2026/SRD10/Motion.pdf",
        "files",
        "documents",
        "files",
      ),
    ).toBe("public/srd/2026/SRD10");
  });

  it("rejects paths outside the allowed buckets", () => {
    expect(
      getMeetingFolder(
        "public/2026/HTM2/Motion.pdf",
        "files",
        "documents",
        "files",
      ),
    ).toBeNull();
  });
});
