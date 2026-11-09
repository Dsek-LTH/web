import {
  PUBLIC_BUCKETS_DOCUMENTS,
  PUBLIC_BUCKETS_FILES,
} from "$env/static/public";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { rename } = vi.hoisted(() => ({ rename: vi.fn() }));
const { updateGroupMap } = vi.hoisted(() => ({ updateGroupMap: vi.fn() }));

vi.mock("$lib/files", () => ({
  fileHandler: { rename, remove: vi.fn() },
}));
vi.mock("$lib/files/documentGroups", () => ({
  isReservedGroupName: (name: string) => name === "_groups.json",
  readGroupMap: vi.fn(),
  updateGroupMap,
}));

import { actions } from "./+page.server";

const editFile = async (data: Record<string, string>) => {
  const body = new FormData();
  for (const [key, value] of Object.entries(data)) body.set(key, value);
  return actions["editFile"]!({
    request: new Request("http://localhost/documents", {
      method: "POST",
      body,
    }),
    locals: { user: undefined },
  } as never);
};

describe("documents editFile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateGroupMap.mockResolvedValue(undefined);
  });

  it("moves the sidecar entry with a renamed nested file", async () => {
    const map = { "Folder/Motion.pdf": "Old" };
    updateGroupMap.mockImplementationOnce(
      async (_user, _bucket, _folder, mutate) => mutate(map),
    );

    await editFile({
      id: "public/2026/HTM1/Folder/Motion.pdf",
      bucket: PUBLIC_BUCKETS_DOCUMENTS,
      name: "Motion2.pdf",
      group: "New",
    });

    expect(rename).toHaveBeenCalledWith(
      undefined,
      PUBLIC_BUCKETS_DOCUMENTS,
      "public/2026/HTM1/Folder/Motion.pdf",
      "Motion2.pdf",
    );
    expect(map).toEqual({ "Folder/Motion2.pdf": "New" });
  });

  it("clears a group without renaming the file", async () => {
    const map = { "Motion.pdf": "Old" };
    updateGroupMap.mockImplementationOnce(
      async (_user, _bucket, _folder, mutate) => mutate(map),
    );

    await editFile({
      id: "public/2026/HTM1/Motion.pdf",
      bucket: PUBLIC_BUCKETS_DOCUMENTS,
      name: "Motion.pdf",
      group: "",
    });

    expect(map).toEqual({});
  });

  it("keeps replacement patterns in renamed file names literal", async () => {
    const map = { "Motion.pdf": "Old" };
    updateGroupMap.mockImplementationOnce(
      async (_user, _bucket, _folder, mutate) => mutate(map),
    );

    await editFile({
      id: "public/2026/HTM1/Motion.pdf",
      bucket: PUBLIC_BUCKETS_DOCUMENTS,
      name: "Motion$&.pdf",
      group: "Old",
    });

    expect(map).toEqual({ "Motion$&.pdf": "Old" });
  });

  it("does not write a sidecar for an ungrouped rename", async () => {
    updateGroupMap.mockImplementationOnce(
      async (_user, _bucket, _folder, mutate) => {
        expect(mutate({})).toBe(false);
      },
    );

    await editFile({
      id: "public/2026/HTM1/Motion.pdf",
      bucket: PUBLIC_BUCKETS_DOCUMENTS,
      name: "Motion2.pdf",
      group: "",
    });

    expect(rename).toHaveBeenCalled();
  });

  it("warns instead of failing when the rename succeeded but the sidecar write failed", async () => {
    updateGroupMap.mockRejectedValueOnce(new Error("sidecar unavailable"));

    const result = await editFile({
      id: "public/2026/HTM1/Motion.pdf",
      bucket: PUBLIC_BUCKETS_DOCUMENTS,
      name: "Motion2.pdf",
      group: "New",
    });

    expect(rename).toHaveBeenCalled();
    expect(
      (result as { form?: { message?: { type?: string } } }).form?.message
        ?.type,
    ).toBe("warning");
  });

  it("does not write a sidecar for old-format SRD files", async () => {
    await editFile({
      id: "public/srd/2026/protokoll.pdf",
      bucket: PUBLIC_BUCKETS_FILES,
      name: "protokoll.pdf",
      group: "",
    });

    expect(updateGroupMap).not.toHaveBeenCalled();
  });

  it("rejects renaming a file to the sidecar name", async () => {
    await editFile({
      id: "public/2026/HTM1/Motion.pdf",
      bucket: PUBLIC_BUCKETS_DOCUMENTS,
      name: "_groups.json",
      group: "",
    });

    expect(rename).not.toHaveBeenCalled();
    expect(updateGroupMap).not.toHaveBeenCalled();
  });
});
