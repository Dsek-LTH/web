const VIDEO_ID_PATTERN = /^[\w-]{11}$/;
const NOCOOKIE_EMBED_ORIGIN = "https://www.youtube-nocookie.com";

export type YouTubeThumbnailQuality = "sddefault" | "hqdefault";

function toVideoId(candidate: string | null | undefined): string | null {
  return candidate && VIDEO_ID_PATTERN.test(candidate) ? candidate : null;
}

function assertVideoId(videoId: string): string {
  if (!VIDEO_ID_PATTERN.test(videoId)) {
    throw new Error(`Invalid YouTube video id: ${videoId}`);
  }
  return videoId;
}

/**
 * Extracts the 11 character video id from any common YouTube URL shape
 * (watch, youtu.be, shorts, embed, live, music, ...). Bare ids are accepted
 * too. Returns null for anything that does not look like a YouTube video.
 */
export function getYouTubeVideoId(
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
export function getYouTubeEmbedUrl(videoId: string, autoplay = false): string {
  const id = assertVideoId(videoId);
  const params = new URLSearchParams({ rel: "0", playsinline: "1" });
  if (autoplay) params.set("autoplay", "1");
  return `${NOCOOKIE_EMBED_ORIGIN}/embed/${id}?${params.toString()}`;
}

/** Convenience wrapper for when you only have the URL that was stored. */
export function getYouTubeEmbedUrlFromUrl(
  url: string | null | undefined,
): string | null {
  const videoId = getYouTubeVideoId(url);
  return videoId ? getYouTubeEmbedUrl(videoId) : null;
}

export function getYouTubeThumbnailUrl(
  videoId: string,
  quality: YouTubeThumbnailQuality = "sddefault",
): string {
  const id = assertVideoId(videoId);
  return `https://i.ytimg.com/vi/${id}/${quality}.jpg`;
}

/** Returns the next thumbnail size to try, or null when none are left. */
export function nextYouTubeThumbnailQuality(
  quality: YouTubeThumbnailQuality,
): YouTubeThumbnailQuality | null {
  return quality === "sddefault" ? "hqdefault" : null;
}
