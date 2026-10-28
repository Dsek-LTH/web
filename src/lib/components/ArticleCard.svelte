<script lang="ts">
  import type { Article } from "$lib/news/getArticles";
  import dayjs from "dayjs";
  import AuthorCard from "./AuthorCard.svelte";
  import { Marked } from "marked";
  import type { Tokens } from "marked";
  import CommitteePlaceholder from "$lib/components/images/CommitteePlaceholder.svelte";

  let {
    article,
    index,
  }: {
    article: Pick<
      Article,
      | "author"
      | "slug"
      | "imageUrl"
      | "header"
      | "body"
      | "createdAt"
      | "committee"
    >;
    index: number;
  } = $props();

  let failedImageUrl = $state<string | null>(null);

  const renderer = {
    // this removes links in the article preview, preventing svelte hydration issues
    link({ tokens }: { tokens: Tokens.Link }): string {
      // @ts-expect-error using marked types from documentation
      const text: string = this.parser.parseInline(tokens);

      return `
            <span>${text}</span>`;
    },
    heading({ tokens }: { tokens: Tokens.Heading }): string {
      //remove headings from preview
      // @ts-expect-error using marked types from documentation
      const text: string = this.parser.parseInline(tokens);

      return `
            <span>${text}</span>`;
    },
  };

  const previewMarked = new Marked();

  // @ts-expect-error using marked types from documentation
  previewMarked.use({ renderer });
</script>

<div
  class="hover:bg-muted-background animate-in fade-in fill-mode-backwards slide-in-from-bottom-[2rem] border-border flex flex-col rounded-xl border-[1px] p-4 duration-300"
  style="animation-delay:{index * 50}ms"
>
  <a href={"/news/" + article.slug}>
    <!-- The placeholder stays underneath: a broken image paints nothing, and
         mounting it unconditionally also covers failures that happen before
         hydration (when the error event has no listener yet). -->
    <div
      class="bg-muted-background relative aspect-[2/1] w-full shrink-0 overflow-hidden rounded-md"
    >
      <div class="absolute inset-0" aria-hidden="true">
        <CommitteePlaceholder
          committee={article.committee}
          class="absolute inset-0"
        />
      </div>
      {#if article.imageUrl && failedImageUrl !== article.imageUrl}
        {@const url = article.imageUrl}
        {#key url}
          <img
            src={url}
            alt=""
            loading="lazy"
            class="absolute inset-0 size-full object-cover opacity-0"
            onload={(event) =>
              (event.currentTarget as HTMLImageElement).classList.replace(
                "opacity-0",
                "opacity-100",
              )}
            onerror={(event) =>
              (failedImageUrl = (
                event.currentTarget as HTMLImageElement
              ).getAttribute("src"))}
          />
        {/key}
      {/if}
    </div>
    <h3 class="mt-2 px-2">
      {article.header}
    </h3>
    <div class="prose-p:text-foreground line-clamp-2 px-2 overflow-ellipsis">
      <!-- eslint-disable-next-line svelte/no-at-html-tags this should already be sanitized -->
      {@html previewMarked.parse(article.body)}
    </div></a
  >
  <div class="mt-auto flex flex-row items-center justify-between pt-2">
    <AuthorCard
      member={article.author.member}
      customAuthor={article.author.customAuthor}
      position={article.author.mandate?.position}
    />
    <span class="text-muted-foreground"
      >{dayjs(article.createdAt).format("YYYY-MM-DD")}</span
    >
  </div>
</div>
