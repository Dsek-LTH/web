<script lang="ts">
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import { Button, buttonVariants } from "$lib/components/ui/button";
  import dayjs from "dayjs";
  import Pen from "@lucide/svelte/icons/pen";
  import Trash from "@lucide/svelte/icons/trash";
  import ImageList from "$lib/components/ImageList.svelte";
  import MarkdownBody from "$lib/components/MarkdownBody.svelte";
  import TagChip from "$lib/components/TagChip.svelte";
  import RemoveArticleDialog from "./RemoveArticleDialog.svelte";
  import type { Snippet } from "svelte";
  import type { components } from "$lib/api/schema";

  type ArticleSummary = components["schemas"]["ArticleSummary"];

  let {
    article,
    canEdit,
    canDelete,
    children,
  }: {
    article: Pick<
      ArticleSummary,
      "header" | "slug" | "createdAt" | "tags" | "body" | "imageUrls"
    >;
    canEdit: boolean;
    canDelete: boolean;
    children?: Snippet;
  } = $props();
</script>

<SetPageTitle title={article.header} />

<main class="flex flex-col gap-2">
  <div class="flex flex-row justify-between">
    <h2>{article.header}</h2>
    <div class="flex flex-row gap-2">
      {#if canEdit}<a href={"/news/" + article.slug + "/edit"}
          ><Button variant="outline"><Pen /></Button></a
        >{/if}
      {#if canDelete}
        <RemoveArticleDialog
          slug={article.slug}
          triggerClass={buttonVariants({ variant: "outline" })}
        >
          <Trash />
        </RemoveArticleDialog>
      {/if}
    </div>
  </div>

  <div class="flex flex-row items-center justify-between">
    {@render children?.()}
    <div class="flex flex-row *:mx-1">
      <p class="text-muted-foreground">
        {dayjs(article.createdAt).format("YYYY-MM-DD")}
      </p>
    </div>
  </div>
  <div class="flex flex-row flex-wrap gap-2">
    {#each article.tags ?? [] as tag (tag.id)}
      <TagChip {tag} />
    {/each}
  </div>
  <MarkdownBody class="text-foreground article-body" body={article.body} />
  {#if article.imageUrls?.length}
    <ImageList images={article.imageUrls} />
  {/if}
</main>
