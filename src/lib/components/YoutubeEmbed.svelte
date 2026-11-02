<script lang="ts">
  import YoutubeFrame from "./YoutubeFrame.svelte";
  import { getYoutubeEmbedUrlFromUrl } from "$lib/utils/youtube";

  let {
    url,
    title,
  }: {
    /** The raw URL that was stored on the article. */
    url: string | null | undefined;
    /** Describes the video for screen readers. */
    title: string;
  } = $props();

  const embedUrl = $derived(getYoutubeEmbedUrlFromUrl(url));
</script>

{#if embedUrl}
  <div class="aspect-video w-full overflow-hidden rounded-xl border">
    <YoutubeFrame src={embedUrl} {title} lazy />
  </div>
{/if}
