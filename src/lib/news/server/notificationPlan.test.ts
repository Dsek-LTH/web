import { describe, expect, it } from "vitest";
import { planArticleNotification } from "./notificationPlan";

const now = new Date("2026-06-15T12:00:00Z");
const past = new Date("2026-06-01T12:00:00Z");
const future = new Date("2026-07-01T12:00:00Z");

describe("planArticleNotification", () => {
  it("sends now when a scheduled article is published early", () => {
    expect(
      planArticleNotification({
        sendNotification: true,
        previousPublishedAt: future,
        publishedAt: now,
        now,
      }),
    ).toBe("sendNow");
  });

  it("schedules while the article stays in the future", () => {
    expect(
      planArticleNotification({
        sendNotification: true,
        previousPublishedAt: future,
        publishedAt: future,
        now,
      }),
    ).toBe("schedule");
  });

  it.each([
    ["keeping its publish time", past],
    ["republishing it now", now],
    ["moving it to the future", future],
  ])(
    "doesn't re-notify when editing a live article by %s",
    (_, publishedAt) => {
      expect(
        planArticleNotification({
          sendNotification: true,
          previousPublishedAt: past,
          publishedAt,
          now,
        }),
      ).toBe("none");
    },
  );

  it("respects an unticked notification checkbox", () => {
    expect(
      planArticleNotification({
        sendNotification: false,
        previousPublishedAt: future,
        publishedAt: now,
        now,
      }),
    ).toBe("none");
  });
});
