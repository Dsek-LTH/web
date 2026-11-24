import { beforeEach, describe, expect, it, vi } from "vitest";

const { getPresignedPutUrl, isAuthorized } = vi.hoisted(() => ({
  getPresignedPutUrl: vi.fn().mockResolvedValue("http://minio.test/put-url"),
  isAuthorized: vi.fn(() => false),
}));

vi.mock("$lib/files", () => ({ fileHandler: { getPresignedPutUrl } }));
vi.mock("$lib/utils/authorization", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("$lib/utils/authorization")>();
  return { ...actual, isAuthorized };
});
vi.mock("$lib/server/metrics", () => ({
  httpRequestsTotal: { inc: vi.fn() },
  httpRequestDurationMs: { startTimer: vi.fn() },
  inflightRequests: { inc: vi.fn(), dec: vi.fn() },
}));

import sharp from "sharp";
import { actions } from "./+page.server";
import { actions as editActions } from "./edit/+page.server";

const uploadPicture = actions["uploadPicture"]!;
const editUploadPicture = editActions["uploadPicture"]!;

const makeUploadRequest = async () => {
  const image = await sharp({
    create: {
      width: 200,
      height: 200,
      channels: 3,
      background: { r: 1, g: 2, b: 3 },
    },
  })
    .jpeg()
    .toBuffer();
  const formData = new FormData();
  formData.set("image", new File([image], "pic.jpg", { type: "image/jpeg" }));
  formData.set("cropX", "0");
  formData.set("cropY", "0");
  formData.set("cropWidth", "200");
  formData.set("cropHeight", "200");
  return new Request("http://localhost/members/me?/uploadPicture", {
    method: "POST",
    body: formData,
  });
};

const event = async (studentId: string) =>
  ({
    params: { studentId },
    locals: {
      user: { studentId: "me5081wi-s" },
      prisma: {},
    },
    request: await makeUploadRequest(),
  }) as never;

describe("profile picture upload permissions", () => {
  beforeEach(() => {
    getPresignedPutUrl.mockClear();
    isAuthorized.mockReset().mockReturnValue(false);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 200 }),
    );
  });

  it("lets the profile owner upload", async () => {
    await uploadPicture(await event("me5081wi-s"));

    expect(getPresignedPutUrl).toHaveBeenCalledOnce();
  });

  it("refuses another member without core:member:update", async () => {
    await expect(
      uploadPicture(await event("someone-else")),
    ).rejects.toMatchObject({ status: 403 });
    expect(getPresignedPutUrl).not.toHaveBeenCalled();
  });

  it("lets a member editor upload for another member", async () => {
    isAuthorized.mockReturnValue(true);

    await uploadPicture(await event("someone-else"));

    expect(isAuthorized).toHaveBeenCalledWith(
      "core:member:update",
      expect.objectContaining({ studentId: "me5081wi-s" }),
    );
    expect(getPresignedPutUrl).toHaveBeenCalledOnce();
  });

  it("lets a member editor upload from the edit page", async () => {
    isAuthorized.mockReturnValue(true);

    await editUploadPicture(await event("someone-else"));

    expect(getPresignedPutUrl).toHaveBeenCalledOnce();
  });
});
