<script lang="ts">
  import type { Article } from "$lib/news/getArticles";
  import dayjs from "dayjs";
  import AuthorCard from "./AuthorCard.svelte";
  import { Marked } from "marked";
  import type { Tokens } from "marked";

  let { article, index }: { article: Article; index: number } = $props();

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
    {#if article.imageUrl}
      <div
        style="background-image: url({article.imageUrl});"
        class="aspect-[2/1] w-full shrink-0 rounded-md bg-[#eee] bg-cover bg-center"
      ></div>
    {:else}
      <div
        style="background-image: url(https://raw.githubusercontent.com/Dsek-LTH/grafik/refs/heads/main/guild/d_sektionen/full/color.svg);"
        class="aspect-[2/1] w-full shrink-0 rounded-md bg-[#eee] bg-size-[30%] bg-center bg-no-repeat"
      ></div>
    {/if}
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
