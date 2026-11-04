import {
  PUBLIC_BUCKETS_DOCUMENTS,
  PUBLIC_BUCKETS_FILES,
} from "$env/static/public";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { remove } = vi.hoisted(() => ({ remove: vi.fn() }));

vi.mock("$lib/files", () => ({
  fileHandler: { remove },
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

  it("rejects other buckets", async () => {
    await deleteFile("public/2026/HTM1/protokoll.pdf", "members");

    expect(remove).not.toHaveBeenCalled();
  });
});
