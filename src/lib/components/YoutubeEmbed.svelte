<script lang="ts">
  import YoutubeFrame from "./YoutubeFrame.svelte";
  import { getYoutubeEmbedUrlFromUrl } from "$lib/utils/youtube";
  import { cn } from "$lib/utils";

  let {
    url,
    title,
    class: klass,
  }: {
    /** The raw URL that was stored on the article. */
    url: string | null | undefined;
    /** Describes the video for screen readers. */
    title: string;
    class?: string;
  } = $props();

  const embedUrl = $derived(getYoutubeEmbedUrlFromUrl(url));
</script>

{#if embedUrl}
  <div
    class={cn("aspect-video w-full overflow-hidden rounded-xl border", klass)}
  >
    <YoutubeFrame src={embedUrl} {title} lazy />
  </div>
{/if}
