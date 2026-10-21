<script lang="ts">
  import {
    getYoutubeThumbnailUrl,
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
    /** Called when both maxres and hq thumbnails are unavailable. */
    onunavailable?: () => void;
  } = $props();

  let quality = $state<YoutubeThumbnailQuality>("maxresdefault");
  let failed = $state(false);

  function fallback() {
    if (quality === "maxresdefault") {
      quality = "hqdefault";
    } else {
      failed = true;
      onunavailable?.();
    }
  }
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
