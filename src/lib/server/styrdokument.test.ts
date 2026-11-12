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

test("catalog fetch is cached and groups typst files", async () => {
  const fetchMock = vi.fn(() => Promise.resolve(json(treeResponse)));
  vi.stubGlobal("fetch", fetchMock);
  const { getGoverningCatalog } = await import("./styrdokument");
  const first = await getGoverningCatalog();
  const second = await getGoverningCatalog();
  expect(first).toEqual(second);
  expect(first.flatMap((g) => g.documents)).toHaveLength(2);
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

test("unknown slugs are rejected without a request", async () => {
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  const { resolveGoverningDocument } = await import("./styrdokument");
  await expect(resolveGoverningDocument("../../etc/passwd")).resolves.toEqual({
    status: "unknown",
  });
  expect(fetchMock).not.toHaveBeenCalled();
});

test("catalog failure is reported as unavailable for unmanifested slugs", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.reject(new Error("offline"))),
  );
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
  const { loadGoverningSource, resolveGoverningDocument } = await import(
    "./styrdokument"
  );
  const resolved = await resolveGoverningDocument("stadgar");
  if (resolved.status !== "ok") throw new Error("expected ok");
  const loaded = await loadGoverningSource(resolved.document);
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
  const { loadGoverningSource, resolveGoverningDocument } = await import(
    "./styrdokument"
  );
  const resolved = await resolveGoverningDocument("stadgar");
  if (resolved.status !== "ok") throw new Error("expected ok");
  const loaded = await loadGoverningSource(resolved.document);
  expect(loaded.source).toContain("color.svg");
  expect(loaded.assets).toEqual([]);
  expect(loaded.assetWarning).toBe(true);
});

test("source and assets are cached across loads", async () => {
  const fetchMock = vi.fn((input: RequestInfo | URL) => {
    const url = String(input);
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
  const { loadGoverningSource, resolveGoverningDocument } = await import(
    "./styrdokument"
  );
  const resolved = await resolveGoverningDocument("stadgar");
  if (resolved.status !== "ok") throw new Error("expected ok");

  await loadGoverningSource(resolved.document);
  const callsAfterFirst = fetchMock.mock.calls.length;
  await loadGoverningSource(resolved.document);

  expect(fetchMock.mock.calls.length).toBe(callsAfterFirst);
});
