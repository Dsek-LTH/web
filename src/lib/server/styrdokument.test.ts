import { afterEach, beforeEach, expect, test, vi } from "vitest";

const treeResponse = {
  tree: [
    { path: "stadgar.typ", type: "blob" },
    { path: "policyer/policy-for-val.typ", type: "blob" },
    { path: "README.md", type: "blob" },
  ],
};

function json(body: unknown) {
  return new Response(JSON.stringify(body), { status: 200 });
}

beforeEach(async () => {
  const { resetGoverningCacheForTests } = await import("./styrdokument");
  resetGoverningCacheForTests();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

/** Stub fetch with the tree plus per-file heads, returning the fetch mock. */
function stubFetch(options: {
  heads?: Record<string, string>;
  failHeads?: string[];
  failTree?: boolean;
}) {
  return vi.fn((input: RequestInfo | URL) => {
    const url = new URL(String(input));
    if (url.host === "api.github.com" && url.pathname.includes("/git/trees/")) {
      return options.failTree
        ? Promise.reject(new Error("offline"))
        : Promise.resolve(json(treeResponse));
    }
    if (url.host === "raw.githubusercontent.com") {
      const path = url.pathname.replace(/^\/[^/]+\/[^/]+\//, "");
      if (options.failHeads?.includes(path)) {
        return Promise.reject(new Error("404"));
      }
      return Promise.resolve(
        new Response(options.heads?.[path] ?? "", { status: 200 }),
      );
    }
    return Promise.reject(new Error(`unexpected fetch: ${url}`));
  });
}

test("the catalog is built from tree paths and cached source heads", async () => {
  const fetchMock = stubFetch({
    heads: {
      "stadgar.typ": "#show: statutes\n",
      "policyer/policy-for-val.typ":
        '#show: policy.with(\n  subject: "val",\n)\n',
    },
  });
  vi.stubGlobal("fetch", fetchMock);
  const { getGoverningCatalog } = await import("./styrdokument");
  const first = await getGoverningCatalog();
  const second = await getGoverningCatalog();
  expect(first).toEqual(second);
  expect(first.flatMap((g) => g.documents)).toHaveLength(2);
  expect(
    first.flatMap((g) => g.documents).find((d) => d.slug === "policy-for-val"),
  ).toMatchObject({ title: "Policy för val", group: "policies" });
  // One tree request per file head; the second load hits the cache.
  expect(fetchMock.mock.calls.length).toBe(3);
});

test("a failed head fetch falls back to the path-derived description", async () => {
  vi.stubGlobal(
    "fetch",
    stubFetch({ heads: {}, failHeads: ["policyer/policy-for-val.typ"] }),
  );
  const { getGoverningCatalog } = await import("./styrdokument");
  const catalog = await getGoverningCatalog();
  const document = catalog
    .flatMap((g) => g.documents)
    .find((d) => d.slug === "policy-for-val");
  expect(document).toMatchObject({
    title: "Policy för val",
    group: "policies",
  });
});

test("reads from the main branch by default", async () => {
  const fetchMock = stubFetch({ heads: {} });
  vi.stubGlobal("fetch", fetchMock);
  const { getGoverningCatalog } = await import("./styrdokument");
  await getGoverningCatalog();
  const urls = fetchMock.mock.calls.map(([input]) => String(input));
  expect(urls.some((url) => url.includes("/git/trees/main"))).toBe(true);
});

test("unknown slugs are rejected through the (cached) catalog", async () => {
  const fetchMock = stubFetch({ heads: {} });
  vi.stubGlobal("fetch", fetchMock);
  const { resolveGoverningDocument } = await import("./styrdokument");
  await expect(resolveGoverningDocument("some-new-document")).resolves.toEqual({
    status: "unknown",
  });
  // A second lookup of an equally unknown slug must not re-fetch anything.
  await expect(resolveGoverningDocument("some-new-document")).resolves.toEqual({
    status: "unknown",
  });
  // One tree request plus one head per file.
  expect(fetchMock.mock.calls.length).toBe(3);
});

test("a slug with invalid characters is rejected without any request", async () => {
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  const { resolveGoverningDocument } = await import("./styrdokument");
  await expect(resolveGoverningDocument("../../etc/passwd")).resolves.toEqual({
    status: "unknown",
  });
  expect(fetchMock).not.toHaveBeenCalled();
});

test("catalog failure is reported as unavailable", async () => {
  vi.stubGlobal("fetch", stubFetch({ failTree: true }));
  const { resolveGoverningDocument } = await import("./styrdokument");
  await expect(resolveGoverningDocument("some-new-document")).resolves.toEqual({
    status: "unavailable",
  });
});

test("loads source and grafik assets as base64", async () => {
  const fetchMock = vi.fn((input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/git/trees/")) return Promise.resolve(json(treeResponse));
    if (url.includes("/commits/"))
      return Promise.resolve(json({ sha: "abc123" }));
    if (url.includes("grafik")) {
      return Promise.resolve(new Response("<svg/>", { status: 200 }));
    }
    return Promise.resolve(
      new Response(
        '#import "@preview/dsek:0.1.0": *\n#image(path("/grafik/guild/dsek/color.svg"))\n',
        { status: 200 },
      ),
    );
  });
  vi.stubGlobal("fetch", fetchMock);
  const { loadGoverningSource, getGoverningCatalog } =
    await import("./styrdokument");
  const catalog = await getGoverningCatalog();
  const document = catalog.flatMap((g) => g.documents)[0]!;
  const loaded = await loadGoverningSource(document);
  expect(loaded.commit).toBe("abc123");
  expect(loaded.source).toContain("color.svg");
  expect(loaded.assets).toEqual([
    {
      path: "/grafik/guild/dsek/color.svg",
      base64: Buffer.from("<svg/>").toString("base64"),
    },
  ]);
  expect(loaded.assetWarning).toBe(false);
});

test("a missing image warns but does not lose the source", async () => {
  const fetchMock = vi.fn((input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/git/trees/")) return Promise.resolve(json(treeResponse));
    if (url.includes("/commits/"))
      return Promise.resolve(json({ sha: "abc123" }));
    if (url.includes("grafik")) return Promise.reject(new Error("404"));
    return Promise.resolve(
      new Response('#image(path("/grafik/guild/dsek/color.svg"))\n', {
        status: 200,
      }),
    );
  });
  vi.stubGlobal("fetch", fetchMock);
  const { loadGoverningSource, getGoverningCatalog } =
    await import("./styrdokument");
  const catalog = await getGoverningCatalog();
  const document = catalog.flatMap((g) => g.documents)[0]!;
  const loaded = await loadGoverningSource(document);
  expect(loaded.source).toContain("color.svg");
  expect(loaded.assets).toEqual([]);
  expect(loaded.assetWarning).toBe(true);
});

test("source and assets are cached across loads", async () => {
  const fetchMock = vi.fn((input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/git/trees/")) return Promise.resolve(json(treeResponse));
    if (url.includes("/commits/"))
      return Promise.resolve(json({ sha: "abc123" }));
    if (url.includes("grafik"))
      return Promise.resolve(new Response("<svg/>", { status: 200 }));
    return Promise.resolve(
      new Response('#image(path("/grafik/guild/dsek/color.svg"))\n', {
        status: 200,
      }),
    );
  });
  vi.stubGlobal("fetch", fetchMock);
  const { loadGoverningSource, getGoverningCatalog } =
    await import("./styrdokument");
  const catalog = await getGoverningCatalog();
  const document = catalog.flatMap((g) => g.documents)[0]!;

  await loadGoverningSource(document);
  const callsAfterFirst = fetchMock.mock.calls.length;
  await loadGoverningSource(document);

  expect(fetchMock.mock.calls.length).toBe(callsAfterFirst);
});
