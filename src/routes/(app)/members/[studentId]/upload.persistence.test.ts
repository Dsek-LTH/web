import { beforeEach, describe, expect, it, vi } from "vitest";

const { getPresignedPutUrl, memberUpdate } = vi.hoisted(() => ({
  getPresignedPutUrl: vi.fn().mockResolvedValue("http://minio.test/put-url"),
  memberUpdate: vi.fn().mockResolvedValue({}),
}));

vi.mock("$lib/files", () => ({ fileHandler: { getPresignedPutUrl } }));
vi.mock("$lib/server/metrics", () => ({
  httpRequestsTotal: { inc: vi.fn() },
  httpRequestDurationMs: { startTimer: vi.fn() },
  inflightRequests: { inc: vi.fn(), dec: vi.fn() },
}));

import sharp from "sharp";
import { actions } from "./+page.server";

const uploadPicture = actions["uploadPicture"]!;

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

describe("profile picture upload persistence", () => {
  beforeEach(() => {
    memberUpdate.mockClear();
    getPresignedPutUrl.mockClear();
  });

  it("stores the uploaded picture on the member", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 200 }),
    );

    const result = await uploadPicture({
      params: { studentId: "me5081wi-s" },
      locals: {
        user: { studentId: "me5081wi-s" },
        prisma: { member: { update: memberUpdate } },
      },
      request: await makeUploadRequest(),
    } as never);

    expect(result).toMatchObject({
      form: { message: { type: "success" } },
    });
    expect(getPresignedPutUrl).toHaveBeenCalledOnce();
    expect(memberUpdate).toHaveBeenCalledWith({
      where: { studentId: "me5081wi-s" },
      data: {
        picturePath: expect.stringMatching(
          /^https:\/\/files-sandbox\.dsek\.se\/members\/public\/me5081wi-s\/profile-picture\/[0-9a-f-]+\.webp$/,
        ),
      },
    });
  });

  it("refuses to upload to another member's profile", async () => {
    await expect(
      uploadPicture({
        params: { studentId: "someone-else" },
        locals: {
          user: { studentId: "me5081wi-s" },
          prisma: { member: { update: memberUpdate } },
        },
        request: await makeUploadRequest(),
      } as never),
    ).rejects.toMatchObject({ status: 403 });
    expect(memberUpdate).not.toHaveBeenCalled();
  });
});
