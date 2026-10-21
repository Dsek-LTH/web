import { describe, expect, it } from "vitest";
import {
  getYoutubeEmbedUrl,
  getYoutubeEmbedUrlFromUrl,
  getYoutubeThumbnailUrl,
  getYoutubeVideoId,
} from "./youtube";

describe("getYoutubeVideoId", () => {
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
    expect(getYoutubeVideoId(url)).toBe(expected);
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
    expect(getYoutubeVideoId(url)).toBeNull();
  });
});

describe("getYoutubeEmbedUrl", () => {
  it("uses the nocookie domain and only non-default parameters", () => {
    const url = new URL(getYoutubeEmbedUrl("dQw4w9WgXcQ"));
    expect(url.host).toBe("www.youtube-nocookie.com");
    expect(url.pathname).toBe("/embed/dQw4w9WgXcQ");
    expect(url.searchParams.get("rel")).toBe("0");
    expect(url.searchParams.get("playsinline")).toBe("1");
    expect(url.searchParams.has("autoplay")).toBe(false);
  });

  it("enables autoplay when asked", () => {
    const url = new URL(getYoutubeEmbedUrl("dQw4w9WgXcQ", true));
    expect(url.searchParams.get("autoplay")).toBe("1");
  });

  it("returns null when the url has no video id", () => {
    expect(getYoutubeEmbedUrlFromUrl("https://example.com")).toBeNull();
  });
});

describe("getYoutubeThumbnailUrl", () => {
  it("builds a thumbnail url", () => {
    expect(getYoutubeThumbnailUrl("dQw4w9WgXcQ")).toBe(
      "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    );
    expect(getYoutubeThumbnailUrl("dQw4w9WgXcQ", "hqdefault")).toBe(
      "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    );
  });
});
