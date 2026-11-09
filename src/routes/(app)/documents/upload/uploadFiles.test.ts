import {
  PUBLIC_BUCKETS_DOCUMENTS,
  PUBLIC_BUCKETS_FILES,
} from "$env/static/public";
import apiNames from "$lib/utils/apiNames";
import type { AuthUser } from "@zenstackhq/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { uploadFileWithKey } = vi.hoisted(() => ({
  uploadFileWithKey: vi.fn(),
}));
const { updateGroupMap } = vi.hoisted(() => ({ updateGroupMap: vi.fn() }));

vi.mock("$lib/files/uploadFiles", () => ({ uploadFileWithKey }));
vi.mock("$lib/files/documentGroups", () => ({ updateGroupMap }));

import { uploadDocumentsFile } from "./uploadFiles";
import { uploadSchema, type UploadSchema } from "./types";

const user = {} as AuthUser;
const data = (overrides: Partial<UploadSchema> = {}) =>
  ({
    type: "meeting",
    folder: "HTM1",
    group: "Fika",
    name: "Motion",
    year: 2026,
    file: new File(["x"], "Motion.pdf", { type: "application/pdf" }),
    ...overrides,
  }) as UploadSchema;

describe("uploadSchema", () => {
  it.each(["", "HTM1/Fika", "../HTM1"])(
    "rejects invalid folder %j",
    (folder) => {
      const result = uploadSchema.safeParse({
        folder,
        file: new File(["x"], "x.pdf", { type: "application/pdf" }),
      });

      expect(result.success).toBe(false);
    },
  );

  it("trims the folder name", () => {
    const result = uploadSchema.safeParse({
      folder: " HTM1 ",
      file: new File(["x"], "x.pdf", { type: "application/pdf" }),
    });

    expect(result.success).toBe(true);
    expect(result.data?.folder).toBe("HTM1");
  });
});

describe("uploadDocumentsFile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    uploadFileWithKey.mockResolvedValue({
      url: "https://files/documents/public/2026/HTM1/Motion.pdf",
      key: "public/2026/HTM1/Motion.pdf",
    });
    updateGroupMap.mockResolvedValue(undefined);
  });

  it("writes the uploaded file's group to the meeting sidecar", async () => {
    const map: Record<string, string> = {};
    updateGroupMap.mockImplementationOnce(
      async (_user, _bucket, _folder, mutate) => mutate(map),
    );

    const form = data();
    await uploadDocumentsFile(user, form);

    expect(uploadFileWithKey).toHaveBeenCalledWith(
      user,
      form.file,
      "public/2026/HTM1",
      PUBLIC_BUCKETS_DOCUMENTS,
      "Motion",
    );
    expect(updateGroupMap).toHaveBeenCalledWith(
      user,
      PUBLIC_BUCKETS_DOCUMENTS,
      "public/2026/HTM1",
      expect.any(Function),
      apiNames.FILES.BUCKET(PUBLIC_BUCKETS_DOCUMENTS).CREATE,
    );
    expect(map).toEqual({ "Motion.pdf": "Fika" });
  });

  it("does not write a sidecar when no group was chosen", async () => {
    await uploadDocumentsFile(user, data({ group: "" }));

    expect(updateGroupMap).not.toHaveBeenCalled();
  });

  it("fails the upload when the sidecar write fails", async () => {
    updateGroupMap.mockRejectedValueOnce(new Error("sidecar unavailable"));

    await expect(uploadDocumentsFile(user, data())).rejects.toThrow(
      "sidecar unavailable",
    );
  });

  it("ignores the group for requirement uploads", async () => {
    uploadFileWithKey.mockResolvedValueOnce({
      url: "https://files/files/public/kravprofiler/2026/EDAF05/x.pdf",
      key: "public/kravprofiler/2026/EDAF05/x.pdf",
    });

    await uploadDocumentsFile(
      user,
      data({ type: "requirement", folder: "EDAF05" }),
    );

    expect(updateGroupMap).not.toHaveBeenCalled();
    expect(uploadFileWithKey).toHaveBeenCalledWith(
      user,
      expect.any(File),
      "public/kravprofiler/2026/EDAF05",
      PUBLIC_BUCKETS_FILES,
      "Motion",
    );
  });
});
