<script lang="ts">
  import type { Article } from "$lib/news/getArticles";
  import dayjs from "dayjs";
  import CommitteePlaceholder from "$lib/components/images/CommitteePlaceholder.svelte";
  import CommitteeSymbol from "$lib/components/images/CommitteeSymbol.svelte";

  let {
    article,
    isPreview,
    index,
  }: {
    article: Pick<
      Article,
      "slug" | "imageUrl" | "header" | "publishedAt" | "committee"
    >;
    isPreview: boolean;
    index: number;
  } = $props();
</script>

<svelte:element
  this={isPreview ? "div" : "a"}
  href={isPreview ? undefined : `/news/${article.slug}`}
  class={[
    "relative aspect-2/1 w-full overflow-hidden rounded-xl border-[1px] transition-all hover:opacity-85",
    !isPreview && "lg:w-1/3",
    index >= 2 && "hidden lg:block",
  ]}
>
  {#if article.imageUrl}
    <div
      class="absolute inset-0 bg-cover bg-center"
      style="background-image: url({article.imageUrl});"
    ></div>
    <div class="absolute top-2 right-2 size-14 p-3">
      <CommitteeSymbol committee={article.committee ?? undefined} class="h-8" />
    </div>
    <div
      class="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 to-transparent"
    ></div>
  {:else}
    <CommitteePlaceholder
      class="absolute inset-0"
      committee={article.committee ?? null}
    />
  {/if}
  <div
    class={[
      "relative flex h-full w-full flex-col justify-end p-4",
      article.imageUrl && "text-white",
    ]}
  >
    <h2 class="line-clamp-2 overflow-hidden">
      {article.header}
    </h2>
    <span class="text-right font-light">
      {dayjs(article.publishedAt).format("YYYY-MM-DD")}
    </span>
  </div>
</svelte:element>
