import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from "@playwright/test";
import { globSync } from "node:fs";
import { API_URL } from "./servers";

// Opens every page in a real browser and checks that it loads without an
// error status, an uncaught exception or a console error. This catches what
// the Go tests and svelte-check can't: a server-only import leaking into
// the client bundle, a load failing against the real API, a page crashing
// after hydration.

// Pages that need a service the tests don't run.
const needsExternal: Record<string, string> = {
  "/admin/links": "the Shlink link shortener",
};

// Every route without a parameter, found from the files, so new pages are
// covered without touching this list. Route groups like (app) aren't part
// of the URL.
const staticRoutes = globSync("**/+page.svelte", { cwd: "src/routes" })
  .map(
    (file) =>
      "/" +
      file
        .split("/")
        .slice(0, -1)
        .filter((part) => !/^\(.*\)$/.test(part))
        .join("/"),
  )
  .filter((route) => !route.includes("[") && !(route in needsExternal))
  .sort();

// Routes with parameters, filled in from the seeded data.
type Fill = (api: APIRequestContext) => Promise<string[]>;
const first = async <T>(
  api: APIRequestContext,
  path: string,
  pick: (body: never) => T[],
): Promise<T> => {
  const res = await api.get(API_URL + path);
  expect(res.ok(), `GET ${path}`).toBeTruthy();
  const items = pick((await res.json()) as never);
  expect(items.length, `GET ${path} has items`).toBeGreaterThan(0);
  return items[0]!;
};
const dynamicRoutes: Record<string, Fill> = {
  article: async (api) => {
    const { slug } = await first(
      api,
      "/articles?pageSize=1",
      (b: { articles: Array<{ slug: string }> }) => b.articles,
    );
    return [`/news/${slug}`, `/news/${slug}/edit`];
  },
  event: async (api) => {
    const { slug } = await first(
      api,
      "/events?pageSize=1",
      (b: { events: Array<{ slug: string }> }) => b.events,
    );
    return [`/events/${slug}`, `/events/${slug}/edit`];
  },
  member: async (api) => {
    const { studentId } = await first(
      api,
      "/members?pageSize=1",
      (b: Array<{ studentId: string }>) => b,
    );
    return [`/members/${studentId}`, `/members/${studentId}/edit`];
  },
  committee: async (api) => {
    const { shortName } = await first(
      api,
      "/committees",
      (b: Array<{ shortName: string }>) => b,
    );
    return [
      `/committees/${shortName}`,
      `/committees/${shortName}/members`,
      `/committees/${shortName}/news`,
    ];
  },
  song: async (api) => {
    const { slug } = await first(
      api,
      "/songs?pageSize=1",
      (b: { songs: Array<{ slug: string }> }) => b.songs,
    );
    return [`/songarchive/${slug}`, `/songarchive/${slug}/edit`];
  },
  election: async (api) => {
    const { id } = await first(
      api,
      "/elections",
      (b: Array<{ id: string }>) => b,
    );
    return [`/elections/${id}/edit`];
  },
  booking: async (api) => {
    const { id } = await first(
      api,
      "/booking-requests",
      (b: Array<{ id: string }>) => b,
    );
    return [`/bookings/${id}/edit`, `/bookings/admin/${id}`];
  },
};

async function expectPageLoads(page: Page, url: string) {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(`uncaught: ${err.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
  });
  const res = await page.goto(url, { waitUntil: "networkidle" });
  expect(res, "a response").not.toBeNull();
  expect(res!.status(), "status").toBeLessThan(400);
  expect(errors).toEqual([]);
}

for (const route of staticRoutes) {
  test(`page ${route}`, async ({ page }) => {
    await expectPageLoads(page, route);
  });
}

for (const [name, fill] of Object.entries(dynamicRoutes)) {
  test(`${name} pages`, async ({ page, request }) => {
    for (const url of await fill(request)) {
      await test.step(url, () => expectPageLoads(page, url));
    }
  });
}
