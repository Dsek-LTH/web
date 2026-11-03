import { beforeEach, describe, expect, it, vi } from "vitest";
import authorizedPrismaClient from "$lib/server/authorizedPrisma";
import { sendNewArticleWebhook } from "./webhooks";

vi.mock("$lib/server/authorizedPrisma", () => ({
  default: {
    member: { findUnique: vi.fn() },
    tag: { findMany: vi.fn() },
    adminSetting: { findMany: vi.fn() },
    article: { updateMany: vi.fn(), update: vi.fn() },
  },
}));

const prisma = vi.mocked(authorizedPrismaClient, { deep: true });
const fetchMock = vi.fn();
const article = {
  id: "article",
  slug: "article",
  headerSv: "Rubrik",
  bodySv: "Text",
  createdAt: new Date("2026-01-01T12:00:00Z"),
  tags: [],
  author: { memberId: "member", mandateId: null },
} as unknown as Parameters<typeof sendNewArticleWebhook>[0];

describe("sendNewArticleWebhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
    prisma.member.findUnique.mockResolvedValue(null);
    prisma.tag.findMany.mockResolvedValue([]);
    prisma.adminSetting.findMany.mockResolvedValue([
      { key: "discord_webhook_se", value: "https://discord.test/webhook" },
    ] as never);
    prisma.article.updateMany.mockResolvedValue({ count: 1 });
  });

  it("posts when it claims the article", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    await sendNewArticleWebhook(article, null);
    expect(prisma.article.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "article", discordAnnouncedAt: null },
      }),
    );
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(prisma.article.update).not.toHaveBeenCalled();
  });

  it("doesn't post an article that has already been claimed", async () => {
    prisma.article.updateMany.mockResolvedValue({ count: 0 });
    await sendNewArticleWebhook(article, null);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ["Discord rejects the post", () => new Response(null, { status: 500 })],
    [
      "Discord can't be reached",
      () => {
        throw new Error("network");
      },
    ],
  ])("releases the claim and throws when %s", async (_, respond) => {
    fetchMock.mockImplementation(async () => respond());
    await expect(sendNewArticleWebhook(article, null)).rejects.toThrow();
    expect(prisma.article.update).toHaveBeenCalledWith({
      where: { id: "article" },
      data: { discordAnnouncedAt: null },
    });
  });

  it("doesn't claim the article when there's no webhook to call", async () => {
    prisma.adminSetting.findMany.mockResolvedValue([]);
    await sendNewArticleWebhook(article, null);
    expect(prisma.article.updateMany).not.toHaveBeenCalled();
  });
});
