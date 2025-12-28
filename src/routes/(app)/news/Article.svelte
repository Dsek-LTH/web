<script lang="ts">
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import { Button, buttonVariants } from "$lib/components/ui/button";
  import dayjs from "dayjs";
  import Pen from "@lucide/svelte/icons/pen";
  import Trash from "@lucide/svelte/icons/trash";
  import * as AlertDialog from "$lib/components/ui/alert-dialog";
  import * as m from "$paraglide/messages";
  import ImageList from "$lib/components/ImageList.svelte";
  import MarkdownBody from "$lib/components/MarkdownBody.svelte";
  import TagChip from "$lib/components/TagChip.svelte";
  import type { Snippet } from "svelte";
  import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";

  let {
    article,
    canEdit,
    canDelete,
    children,
  }: {
    article: ExtendedPrismaModel<"Article"> & {
      tags: Array<ExtendedPrismaModel<"Tag">>;
    };
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
      {#if canEdit}<a href={article.slug + "/edit"}
          ><Button variant="outline"><Pen /></Button></a
        >{/if}
      {#if canDelete}{@render removeArticle()}{/if}
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
  <div class="flex flex-row gap-2">
    {#each article.tags as tag (tag.id)}
      <TagChip {tag} />
    {/each}
  </div>
  <MarkdownBody class="text-foreground" body={article.body} />
  {#if article.imageUrls}
    <ImageList images={article.imageUrls} />
  {/if}
</main>

{#snippet removeArticle()}
  <AlertDialog.Root>
    <AlertDialog.Trigger class={buttonVariants({ variant: "outline" })}>
      <Trash />
    </AlertDialog.Trigger>
    <AlertDialog.Content>
      <AlertDialog.Header>
        <AlertDialog.Title>{m.news_dialog_title()}</AlertDialog.Title>
        <AlertDialog.Description>
          {m.news_dialog_desc()}
        </AlertDialog.Description>
      </AlertDialog.Header>
      <AlertDialog.Footer>
        <AlertDialog.Cancel>{m.cancel()}</AlertDialog.Cancel>
        <form action="?/removeArticle" method="POST">
          <AlertDialog.Action type="submit"
            >{m.news_delete()}</AlertDialog.Action
          >
        </form>
      </AlertDialog.Footer>
    </AlertDialog.Content>
  </AlertDialog.Root>
{/snippet}
