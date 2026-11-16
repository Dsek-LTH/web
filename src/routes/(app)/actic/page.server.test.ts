import { describe, it, expect, vi, beforeEach } from "vitest";
import type { GoverningGroup } from "$lib/actic/governing";

vi.mock("$lib/server/styrdokument", () => ({
  getGoverningCatalog: vi.fn(),
}));

import { getGoverningCatalog } from "$lib/server/styrdokument";
import { load, type CatalogResult } from "./+page.server";

describe("actic landing load", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("streams the catalog without an error flag on success", async () => {
    const catalog: GoverningGroup[] = [{ id: "statutes", documents: [] }];
    vi.mocked(getGoverningCatalog).mockResolvedValue(catalog);

    // The catalog is a streamed promise — the page shell must not wait for it.
    const { catalog: streamed } = load({} as never) as {
      catalog: Promise<CatalogResult>;
    };

    await expect(streamed).resolves.toEqual({
      governingCatalog: catalog,
      governingCatalogError: false,
    });
  });

  it("streams an empty catalog with the error flag when upstream fails", async () => {
    vi.mocked(getGoverningCatalog).mockRejectedValue(
      new Error("upstream down"),
    );

    const { catalog: streamed } = load({} as never) as {
      catalog: Promise<CatalogResult>;
    };

    await expect(streamed).resolves.toEqual({
      governingCatalog: [],
      governingCatalogError: true,
    });
  });
});
