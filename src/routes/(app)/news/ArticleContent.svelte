<script lang="ts">
  import dayjs from "dayjs";
  import ImageList from "$lib/components/ImageList.svelte";
  import MarkdownBody from "$lib/components/MarkdownBody.svelte";
  import YoutubeEmbed from "$lib/components/YoutubeEmbed.svelte";
  import TagChip from "$lib/components/TagChip.svelte";
  import type { ArticlePreviewData } from "$lib/news/preview";
  import type { Snippet } from "svelte";

  let {
    article,
    headerActions,
    byline,
  }: {
    article: ArticlePreviewData;
    headerActions?: Snippet;
    byline?: Snippet;
  } = $props();
</script>

<div class="flex min-w-0 flex-col gap-2">
  <div class="flex flex-row justify-between gap-2">
    <h2 class="min-w-0 break-words">{article.header}</h2>
    {#if headerActions}
      <div class="flex shrink-0 flex-row gap-2">
        {@render headerActions()}
      </div>
    {/if}
  </div>

  <div class="flex flex-row items-center justify-between">
    {@render byline?.()}
    <div class="flex shrink-0 flex-row *:mx-1">
      <p class="text-muted-foreground">
        {dayjs(article.createdAt).format("YYYY-MM-DD")}
      </p>
    </div>
  </div>

  <div class="flex flex-row flex-wrap gap-2">
    {#each article.tags as tag (tag.id)}
      <TagChip {tag} />
    {/each}
  </div>

  <YoutubeEmbed url={article.youtubeUrl} title={article.header} />
  <MarkdownBody
    class="article-body text-foreground min-w-0 overflow-x-auto break-words"
    body={article.body}
  />
  {#if article.imageUrls.length > 0}
    <ImageList images={article.imageUrls} />
  {/if}
</div>
