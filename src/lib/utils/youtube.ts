const VIDEO_ID_PATTERN = /^[\w-]{11}$/;
const NOCOOKIE_EMBED_ORIGIN = "https://www.youtube-nocookie.com";

export type YoutubeThumbnailQuality = "maxresdefault" | "hqdefault";

function toVideoId(candidate: string | null | undefined): string | null {
  return candidate && VIDEO_ID_PATTERN.test(candidate) ? candidate : null;
}

/**
 * Extracts the 11 character video id from any common YouTube URL shape
 * (watch, youtu.be, shorts, embed, live, music, ...). Bare ids are accepted
 * too. Returns null for anything that does not look like a YouTube video.
 */
export function getYoutubeVideoId(
  url: string | null | undefined,
): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (VIDEO_ID_PATTERN.test(trimmed)) return trimmed;

  let parsed: URL;
  try {
    parsed = new URL(
      /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`,
    );
  } catch {
    return null;
  }

  const host = parsed.hostname.toLowerCase().replace(/^(?:www|m)\./, "");

  if (host === "youtu.be") {
    return toVideoId(parsed.pathname.split("/").filter(Boolean).at(0));
  }

  if (
    host !== "youtube.com" &&
    host !== "youtube-nocookie.com" &&
    host !== "music.youtube.com"
  ) {
    return null;
  }

  const fromQuery = toVideoId(parsed.searchParams.get("v"));
  if (fromQuery) return fromQuery;

  const fromPath = parsed.pathname.match(
    /^\/(?:embed|shorts|v|live|e)\/([^/?#]+)/,
  );
  return toVideoId(fromPath?.[1]);
}

/**
 * Builds a privacy-friendly embed URL. `rel=0` and `playsinline=1` are the
 * only non-default parameters we want; autoplay is opt-in because it requires
 * a user gesture for sound.
 */
export function getYoutubeEmbedUrl(videoId: string, autoplay = false): string {
  const params = new URLSearchParams({ rel: "0", playsinline: "1" });
  if (autoplay) params.set("autoplay", "1");
  return `${NOCOOKIE_EMBED_ORIGIN}/embed/${videoId}?${params.toString()}`;
}

/** Convenience wrapper for when you only have the URL that was stored. */
export function getYoutubeEmbedUrlFromUrl(
  url: string | null | undefined,
  autoplay = false,
): string | null {
  const videoId = getYoutubeVideoId(url);
  return videoId ? getYoutubeEmbedUrl(videoId, autoplay) : null;
}

export function getYoutubeThumbnailUrl(
  videoId: string,
  quality: YoutubeThumbnailQuality = "maxresdefault",
): string {
  return `https://i.ytimg.com/vi/${videoId}/${quality}.jpg`;
}
