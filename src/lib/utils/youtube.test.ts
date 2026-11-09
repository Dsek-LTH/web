import { describe, expect, it } from "vitest";
import {
  getYouTubeEmbedUrl,
  getYouTubeEmbedUrlFromUrl,
  getYouTubeThumbnailUrl,
  getYouTubeVideoId,
  nextYouTubeThumbnailQuality,
} from "./youtube";

describe("getYouTubeVideoId", () => {
  it.each([
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://youtube.com/watch?v=dQw4w9WgXcQ&t=42s", "dQw4w9WgXcQ"],
    ["https://m.youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://music.youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://youtu.be/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://youtu.be/dQw4w9WgXcQ?si=abc", "dQw4w9WgXcQ"],
    ["https://www.youtube.com/shorts/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://www.youtube.com/embed/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://www.youtube.com/live/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://www.youtube.com/v/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["  dQw4w9WgXcQ  ", "dQw4w9WgXcQ"],
  ])("parses %s", (url, expected) => {
    expect(getYouTubeVideoId(url)).toBe(expected);
  });

  it.each([
    [null],
    [undefined],
    [""],
    ["   "],
    ["not a url"],
    ["https://vimeo.com/123456"],
    ["https://www.youtube.com/watch?v=tooShort"],
    ["https://www.youtube.com/"],
  ])("rejects %s", (url) => {
    expect(getYouTubeVideoId(url)).toBeNull();
  });
});

describe("getYouTubeEmbedUrl", () => {
  it("uses the nocookie domain and only non-default parameters", () => {
    const url = new URL(getYouTubeEmbedUrl("dQw4w9WgXcQ"));
    expect(url.host).toBe("www.youtube-nocookie.com");
    expect(url.pathname).toBe("/embed/dQw4w9WgXcQ");
    expect(url.searchParams.get("rel")).toBe("0");
    expect(url.searchParams.get("playsinline")).toBe("1");
    expect(url.searchParams.has("autoplay")).toBe(false);
  });

  it("enables autoplay when asked", () => {
    const url = new URL(getYouTubeEmbedUrl("dQw4w9WgXcQ", true));
    expect(url.searchParams.get("autoplay")).toBe("1");
  });

  it("rejects ids that are not 11 safe characters", () => {
    expect(() => getYouTubeEmbedUrl("bad?id=1")).toThrow();
    expect(() => getYouTubeThumbnailUrl("bad?id=1")).toThrow();
  });

  it("returns null when the url has no video id", () => {
    expect(getYouTubeEmbedUrlFromUrl("https://example.com")).toBeNull();
  });
});

describe("getYouTubeThumbnailUrl", () => {
  it("builds a thumbnail url", () => {
    expect(getYouTubeThumbnailUrl("dQw4w9WgXcQ")).toBe(
      "https://i.ytimg.com/vi/dQw4w9WgXcQ/sddefault.jpg",
    );
    expect(getYouTubeThumbnailUrl("dQw4w9WgXcQ", "hqdefault")).toBe(
      "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    );
  });
});

describe("nextYouTubeThumbnailQuality", () => {
  it("falls back from sd to hq, then stops", () => {
    expect(nextYouTubeThumbnailQuality("sddefault")).toBe("hqdefault");
    expect(nextYouTubeThumbnailQuality("hqdefault")).toBeNull();
  });
});
