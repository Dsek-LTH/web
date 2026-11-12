import { describe, it, expect, vi, beforeEach } from "vitest";
import type { GoverningGroup } from "$lib/actic/governing";

vi.mock("$lib/server/styrdokument", () => ({
  getGoverningCatalog: vi.fn(),
}));

import { getGoverningCatalog } from "$lib/server/styrdokument";
import { load } from "./+page.server";

describe("actic landing load", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the catalog and no error on success", async () => {
    const catalog: GoverningGroup[] = [{ id: "statutes", documents: [] }];
    vi.mocked(getGoverningCatalog).mockResolvedValue(catalog);

    const result = await load({} as never);

    expect(result).toEqual({
      governingCatalog: catalog,
      governingCatalogError: false,
    });
  });

  it("returns an empty catalog and flags the error when upstream fails", async () => {
    vi.mocked(getGoverningCatalog).mockRejectedValue(
      new Error("upstream down"),
    );

    const result = await load({} as never);

    expect(result).toEqual({
      governingCatalog: [],
      governingCatalogError: true,
    });
  });
});
