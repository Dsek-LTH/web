import {
  PUBLIC_BUCKETS_DOCUMENTS,
  PUBLIC_BUCKETS_FILES,
} from "$env/static/public";
import apiNames from "$lib/utils/apiNames";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { remove, updateGroupMap } = vi.hoisted(() => ({
  remove: vi.fn(),
  updateGroupMap: vi.fn(),
}));

vi.mock("$lib/files", () => ({
  fileHandler: { remove },
}));
vi.mock("$lib/files/documentGroups", () => ({
  isReservedGroupName: (name: string) => name === "_groups.json",
  readGroupMap: vi.fn(),
  updateGroupMap,
}));

import { actions } from "./+page.server";

const deleteFile = async (id: string, bucket: string) => {
  const body = new FormData();
  body.set("id", id);
  body.set("bucket", bucket);
  return actions["deleteFile"]!({
    request: new Request("http://localhost/documents", {
      method: "POST",
      body,
    }),
    locals: { user: undefined },
  } as never);
};

describe("documents deleteFile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateGroupMap.mockResolvedValue(undefined);
  });

  it("deletes SRD meeting documents from the files bucket", async () => {
    const id = "public/srd/2026/SRD1/protokoll.pdf";

    await deleteFile(id, PUBLIC_BUCKETS_FILES);

    expect(remove).toHaveBeenCalledWith(undefined, PUBLIC_BUCKETS_FILES, [id]);
  });

  it("deletes meeting documents from the documents bucket", async () => {
    const id = "public/2026/HTM1/protokoll.pdf";

    await deleteFile(id, PUBLIC_BUCKETS_DOCUMENTS);

    expect(remove).toHaveBeenCalledWith(undefined, PUBLIC_BUCKETS_DOCUMENTS, [
      id,
    ]);
  });

  it("removes the deleted file from the meeting group map", async () => {
    const map = { "protokoll.pdf": "Motion 1" };
    updateGroupMap.mockImplementationOnce(
      async (_user, _bucket, _folder, mutate) => mutate(map),
    );
    const id = "public/2026/HTM1/protokoll.pdf";

    await deleteFile(id, PUBLIC_BUCKETS_DOCUMENTS);

    expect(updateGroupMap).toHaveBeenCalledWith(
      undefined,
      PUBLIC_BUCKETS_DOCUMENTS,
      "public/2026/HTM1",
      expect.any(Function),
      apiNames.FILES.BUCKET(PUBLIC_BUCKETS_DOCUMENTS).DELETE,
    );
    expect(map).toEqual({});
    expect(remove.mock.invocationCallOrder[0]).toBeLessThan(
      updateGroupMap.mock.invocationCallOrder[0]!,
    );
  });

  it("removes a nested file by its path inside the meeting", async () => {
    const map = {
      "Folder/protokoll.pdf": "Motion 1",
      "protokoll.pdf": "Other",
    };
    updateGroupMap.mockImplementationOnce(
      async (_user, _bucket, _folder, mutate) => mutate(map),
    );

    await deleteFile(
      "public/2026/HTM1/Folder/protokoll.pdf",
      PUBLIC_BUCKETS_DOCUMENTS,
    );

    expect(map).toEqual({ "protokoll.pdf": "Other" });
  });

  it("rejects other buckets", async () => {
    await deleteFile("public/2026/HTM1/protokoll.pdf", "members");

    expect(remove).not.toHaveBeenCalled();
    expect(updateGroupMap).not.toHaveBeenCalled();
  });
});
