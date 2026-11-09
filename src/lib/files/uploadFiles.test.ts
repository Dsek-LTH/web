import { describe, expect, it, vi } from "vitest";

const { getPresignedPutUrl } = vi.hoisted(() => ({
  getPresignedPutUrl: vi.fn(),
}));

vi.mock("$lib/files", () => ({ fileHandler: { getPresignedPutUrl } }));

import type { AuthUser } from "@zenstackhq/runtime";
import * as m from "$paraglide/messages";
import { uploadFileWithKey } from "./uploadFiles";

describe("uploadFileWithKey", () => {
  it("rejects the reserved sidecar filename", async () => {
    await expect(
      uploadFileWithKey(
        {} as AuthUser,
        new File(["x"], "_groups.json", { type: "application/json" }),
        "public/2026/HTM1",
        "documents",
        "_groups",
      ),
    ).rejects.toThrow(m.documents_errors_invalidFileName());
    expect(getPresignedPutUrl).not.toHaveBeenCalled();
  });
});
