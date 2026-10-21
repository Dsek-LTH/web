<script lang="ts">
  import type { Article } from "$lib/news/getArticles";
  import dayjs from "dayjs";
  import CommitteePlaceholder from "$lib/components/images/CommitteePlaceholder.svelte";
  import CommitteeSymbol from "$lib/components/images/CommitteeSymbol.svelte";

  let {
    article,
    isPreview,
  }: {
    article: Pick<
      Article,
      "slug" | "imageUrl" | "header" | "publishedAt" | "committee"
    >;
    isPreview: boolean;
  } = $props();

  let failedImageUrl = $state<string | null>(null);
  const hasImage = $derived(
    !!article.imageUrl && failedImageUrl !== article.imageUrl,
  );
</script>

<svelte:element
  this={isPreview ? "div" : "a"}
  href={isPreview ? undefined : `/news/${article.slug}`}
  class={[
    "bg-muted-background relative aspect-2/1 w-full overflow-hidden rounded-xl border-[1px] transition-all hover:opacity-85",
    !isPreview && "lg:w-1/3",
  ]}
>
  {#if !hasImage}
    <div class="absolute inset-0" aria-hidden="true">
      <CommitteePlaceholder
        committee={article.committee ?? null}
        class="absolute inset-0"
      />
    </div>
  {/if}
  {#if hasImage}
    <img
      src={article.imageUrl}
      alt=""
      loading="lazy"
      class="absolute inset-0 size-full object-cover"
      onerror={() => (failedImageUrl = article.imageUrl)}
    />
  {/if}
  {#if hasImage}
    <div class="absolute top-2 right-2 size-14 p-3">
      <CommitteeSymbol committee={article.committee ?? undefined} class="h-8" />
    </div>
    <div
      class="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-black/95 via-black/60 to-transparent"
    ></div>
  {/if}
  <div
    class={[
      "relative flex h-full w-full flex-col justify-end p-4",
      hasImage && "text-white [text-shadow:0_2px_6px_rgba(0,0,0,0.9)]",
    ]}
  >
    <h2
      class="line-clamp-2 overflow-hidden text-3xl leading-6 lg:text-xl 2xl:text-3xl 2xl:leading-8"
    >
      {article.header}
    </h2>
    <span class="text-right font-light">
      {dayjs(article.publishedAt).format("YYYY-MM-DD")}
    </span>
  </div>
</svelte:element>
