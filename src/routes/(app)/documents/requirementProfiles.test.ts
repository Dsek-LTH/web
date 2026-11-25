import { PUBLIC_BUCKETS_FILES } from "$env/static/public";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getInBucket } = vi.hoisted(() => ({ getInBucket: vi.fn() }));

vi.mock("$lib/files", () => ({ fileHandler: { getInBucket } }));

import {
  getRequirementProfileFolder,
  getRequirementProfileFolders,
} from "./requirementProfiles.server";

describe("getRequirementProfileFolder", () => {
  it("returns the guild meeting or committee folder", () => {
    expect(
      getRequirementProfileFolder(
        "public/kravprofiler/2026/DELTA/ekonomiansvarig.pdf",
      ),
    ).toBe("DELTA");
  });

  it("keeps nested folders", () => {
    expect(
      getRequirementProfileFolder(
        "public/kravprofiler/2026/CPU/Utvecklare/root.pdf",
      ),
    ).toBe("CPU/Utvecklare");
  });

  it("ignores files stored directly in the year folder", () => {
    expect(
      getRequirementProfileFolder("public/kravprofiler/2026/root.pdf"),
    ).toBeUndefined();
  });
});

describe("getRequirementProfileFolders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns unique top-level folders from every year, sorted", async () => {
    getInBucket.mockResolvedValueOnce([
      { id: "public/kravprofiler/2026/VTM/a.pdf" },
      { id: "public/kravprofiler/2026/DELTA/b.pdf" },
      { id: "public/kravprofiler/2025/DELTA/c.pdf" },
      { id: "public/kravprofiler/2026/CPU/Utvecklare/d.pdf" },
      { id: "public/kravprofiler/2026/e.pdf" },
    ]);

    await expect(getRequirementProfileFolders(undefined)).resolves.toEqual([
      "DELTA",
      "VTM",
    ]);
    expect(getInBucket).toHaveBeenCalledWith(
      undefined,
      PUBLIC_BUCKETS_FILES,
      "public/kravprofiler",
      true,
    );
  });
});
