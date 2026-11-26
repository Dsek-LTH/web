import { expect, test } from "@playwright/test";

test.use({ channel: "chrome" });

test("reopens a dragged popover before the next animation frame", async ({
  page,
}) => {
  await page.route("http://localhost:5173/", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<!doctype html><body></body>",
    }),
  );
  await page.goto("http://localhost:5173/");

  const state = await page.evaluate(async () => {
    const modulePath = "/src/lib/actic/fields/attachAction.ts";
    const { attachAction }: typeof import("./attachAction") = await import(
      modulePath
    );
    const first = document.createElement("div");
    const second = document.createElement("div");
    const dragged = document.createElement("div");
    dragged.setAttribute("data-dnd-dragging", "");
    dragged.setAttribute("popover", "manual");
    document.body.append(dragged, first, second);
    attachAction(dragged, null);
    dragged.showPopover();
    const initiallyOpen = dragged.matches(":popover-open");

    // The same kind of move Svelte uses for an existing keyed each block.
    second.before(dragged);
    const closedByMove = !dragged.matches(":popover-open");
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );

    return {
      initiallyOpen,
      closedByMove,
      openOnNextFrame: dragged.matches(":popover-open"),
    };
  });

  expect(state.initiallyOpen).toBe(true);
  expect(state.closedByMove).toBe(true);
  expect(state.openOnNextFrame).toBe(true);
});
