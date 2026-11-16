import { describe, expect, it } from "vitest";
import { resolveImages } from "./cover";

describe("resolveImages", () => {
  it("lists existing images before new ones", () => {
    expect(
      resolveImages({ existing: ["/a.webp"], newUrls: ["/b.webp", "/c.webp"] })
        .imageUrls,
    ).toEqual(["/a.webp", "/b.webp", "/c.webp"]);
  });

  it("uses the first image as cover when none is chosen", () => {
    expect(
      resolveImages({ existing: ["/a.webp"], newUrls: ["/b.webp"] }).imageUrl,
    ).toBe("/a.webp");
    expect(resolveImages({ existing: [], newUrls: ["/b.webp"] }).imageUrl).toBe(
      "/b.webp",
    );
  });

  it("uses the chosen existing image as cover", () => {
    expect(
      resolveImages({
        existing: ["/a.webp", "/b.webp"],
        newUrls: [],
        coverUrl: "/b.webp",
      }).imageUrl,
    ).toBe("/b.webp");
  });

  it("uses the chosen new image as cover", () => {
    expect(
      resolveImages({
        existing: ["/a.webp"],
        newUrls: ["/b.webp", "/c.webp"],
        coverNewIndex: 1,
      }).imageUrl,
    ).toBe("/c.webp");
  });

  it("prefers a chosen new image over a chosen existing one", () => {
    expect(
      resolveImages({
        existing: ["/a.webp"],
        newUrls: ["/b.webp"],
        coverUrl: "/a.webp",
        coverNewIndex: 0,
      }).imageUrl,
    ).toBe("/b.webp");
  });

  it("falls back to the first image when the chosen cover was removed", () => {
    expect(
      resolveImages({
        existing: ["/a.webp"],
        newUrls: [],
        coverUrl: "/removed.webp",
      }).imageUrl,
    ).toBe("/a.webp");
  });

  it("ignores a new image index that is out of range", () => {
    expect(
      resolveImages({
        existing: ["/a.webp"],
        newUrls: ["/b.webp"],
        coverNewIndex: 5,
      }).imageUrl,
    ).toBe("/a.webp");
  });

  it("has no cover when there are no images", () => {
    expect(resolveImages({ existing: [], newUrls: [] })).toEqual({
      imageUrls: [],
      imageUrl: null,
    });
  });
});
