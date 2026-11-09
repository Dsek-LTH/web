<script lang="ts">
  import {
    getYoutubeThumbnailUrl,
    nextYoutubeThumbnailQuality,
    type YoutubeThumbnailQuality,
  } from "$lib/utils/youtube";

  let {
    videoId,
    class: klass,
    onready,
    onunavailable,
  }: {
    videoId: string;
    class?: string;
    /** Called when a thumbnail is visible (including the hq fallback). */
    onready?: () => void;
    /** Called when both sd and hq thumbnails are unavailable. */
    onunavailable?: () => void;
  } = $props();

  let quality = $state<YoutubeThumbnailQuality>("sddefault");
  let failed = $state(false);

  let activeVideoId: string | null = null;

  function fallback() {
    const next = nextYoutubeThumbnailQuality(quality);
    if (next) {
      quality = next;
    } else {
      failed = true;
      onunavailable?.();
    }
  }

  $effect.pre(() => {
    if (videoId === activeVideoId) return;
    activeVideoId = videoId;
    quality = "sddefault";
    failed = false;
  });
</script>

{#if !failed}
  <img
    src={getYoutubeThumbnailUrl(videoId, quality)}
    alt=""
    loading="lazy"
    class={["opacity-0", klass]}
    onerror={fallback}
    onload={(event) => {
      const image = event.currentTarget;
      if (!(image instanceof HTMLImageElement)) return;
      // YouTube sometimes serves a 120x90 grey placeholder with HTTP 200.
      if (image.naturalWidth <= 120) {
        fallback();
        return;
      }
      image.classList.replace("opacity-0", "opacity-100");
      onready?.();
    }}
  />
{/if}
