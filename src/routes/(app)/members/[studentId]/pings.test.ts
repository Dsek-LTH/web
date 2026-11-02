import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ExtendedPrisma } from "$lib/server/extendedPrisma";
import sendNotification from "$lib/utils/notifications";
import { lastPingerId, sendPing } from "./pings";

vi.mock("$lib/utils/notifications", () => ({ default: vi.fn() }));

const earlier = new Date("2026-01-01T12:00:00Z");
const later = new Date("2026-01-02T12:00:00Z");
const ping = { fromMemberId: "first", toMemberId: "second" };

describe("lastPingerId", () => {
  it("is the first pinger until they get pinged back", () => {
    expect(lastPingerId({ ...ping, fromSentAt: earlier, toSentAt: null })).toBe(
      "first",
    );
  });

  it("is the other member after they ping back", () => {
    expect(
      lastPingerId({ ...ping, fromSentAt: earlier, toSentAt: later }),
    ).toBe("second");
  });

  it("is the first pinger again after they ping once more", () => {
    expect(
      lastPingerId({ ...ping, fromSentAt: later, toSentAt: earlier }),
    ).toBe("first");
  });
});

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

  it("rejects pinging again before being pinged back", async () => {
    prisma.ping.findFirst.mockResolvedValue({
      ...ids,
      fromSentAt: earlier,
      toSentAt: null,
    });
    await expect(send("a", "b")).rejects.toMatchObject({ status: 400 });
    expect(prisma.ping.update).not.toHaveBeenCalled();
    expect(sendNotification).not.toHaveBeenCalled();
  });

  it("lets the other member ping back, updating the existing row", async () => {
    prisma.ping.findFirst.mockResolvedValue({
      ...ids,
      fromSentAt: earlier,
      toSentAt: null,
    });
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

  it("allows pinging again after being pinged back", async () => {
    prisma.ping.findFirst.mockResolvedValue({
      ...ids,
      fromSentAt: earlier,
      toSentAt: later,
    });
    await send("a", "b");
    expect(sendNotification).toHaveBeenCalledOnce();
  });
});
