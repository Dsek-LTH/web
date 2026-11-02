import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ExtendedPrisma } from "$lib/server/extendedPrisma";
import sendNotification from "$lib/utils/notifications";
import { sendPing } from "./pings";

vi.mock("$lib/utils/notifications", () => ({ default: vi.fn() }));

describe("sendPing", () => {
  const prisma = {
    member: { findFirst: vi.fn() },
    ping: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
  };
  const ids = { fromMemberId: "a", toMemberId: "b" };
  const send = (from: string, to: string) =>
    sendPing(prisma as unknown as ExtendedPrisma, {
      link: `/members/${from}`,
      fromMemberId: { memberId: from },
      toMemberId: { memberId: to },
    });

  beforeEach(() => {
    vi.clearAllMocks();
    prisma.member.findFirst.mockImplementation(
      async ({ where }: { where: { id: { equals: string } } }) => ({
        id: where.id.equals,
        firstName: "A",
        nickname: null,
        lastName: "B",
      }),
    );
  });

  it("sends the first ping", async () => {
    prisma.ping.findFirst.mockResolvedValue(null);
    await send("a", "b");
    expect(prisma.ping.create).toHaveBeenCalledOnce();
    expect(sendNotification).toHaveBeenCalledOnce();
  });

  it("lets the other member ping back, updating the existing row", async () => {
    prisma.ping.findFirst.mockResolvedValue(ids);
    await send("b", "a");
    expect(prisma.ping.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { fromMemberId_toMemberId: ids },
        data: expect.objectContaining({
          fromSentAt: undefined,
          toSentAt: expect.any(Date),
        }),
      }),
    );
    expect(sendNotification).toHaveBeenCalledOnce();
  });
});
