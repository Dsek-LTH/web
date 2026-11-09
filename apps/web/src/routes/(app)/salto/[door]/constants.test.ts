import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { describe, expect, it } from "vitest";
import { BACKUP_LIST_OF_STUDENT_IDS } from "./constants";

describe("BACKUP_LIST_OF_STUDENT_IDS", () => {
  it("matches Go's backupStudentIDs", () => {
    const goSource = readFileSync(
      fileURLToPath(
        new URL(
          "../../../../../../api/internal/doors/service.go",
          import.meta.url,
        ),
      ),
      "utf8",
    );
    const goList = /var backupStudentIDs = \[\]string\{([^}]*)\}/.exec(
      goSource,
    )?.[1];
    expect(goList).toBeDefined();
    const goIds = [...(goList ?? "").matchAll(/"([^"]+)"/g)].map((m) => m[1]);
    expect(goIds).toEqual(BACKUP_LIST_OF_STUDENT_IDS);
  });
});
