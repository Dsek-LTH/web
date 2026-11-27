import type { AuthUser } from "@zenstackhq/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";
import authorizedPrismaClient from "$lib/server/authorizedPrisma";
import { uploadNotificationToken } from "./uploadNotificationToken";

vi.mock("$lib/server/authorizedPrisma", () => ({
  default: { expoToken: { upsert: vi.fn() } },
}));

const prisma = vi.mocked(authorizedPrismaClient, { deep: true });
const member = { memberId: "member-1" } as AuthUser;
const token = "ExponentPushToken[test]";

describe("uploadNotificationToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("upserts the token every time, so a re-sent token is never skipped", async () => {
    await uploadNotificationToken(member, token);
    await uploadNotificationToken(member, token);

    expect(prisma.expoToken.upsert).toHaveBeenCalledTimes(2);
    expect(prisma.expoToken.upsert).toHaveBeenCalledWith({
      update: { memberId: member.memberId },
      where: { expoToken: token },
      create: { memberId: member.memberId, expoToken: token },
    });
  });

  it("rejects anonymous callers", async () => {
    await expect(
      uploadNotificationToken({} as AuthUser, token),
    ).rejects.toMatchObject({ status: 401 });
    expect(prisma.expoToken.upsert).not.toHaveBeenCalled();
  });
});
