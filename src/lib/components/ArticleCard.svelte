<script lang="ts">
  import type { Article } from "$lib/news/getArticles";
  import dayjs from "dayjs";
  import AuthorCard from "./AuthorCard.svelte";
  import MarkdownBody from "./MarkdownBody.svelte";

  let { article, index }: { article: Article; index: number } = $props();
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
      <MarkdownBody body={article.body} />
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
