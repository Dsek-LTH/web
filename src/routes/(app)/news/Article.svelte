<script lang="ts">
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import { Button, buttonVariants } from "$lib/components/ui/button";
  import Pen from "@lucide/svelte/icons/pen";
  import Trash from "@lucide/svelte/icons/trash";
  import * as AlertDialog from "$lib/components/ui/alert-dialog";
  import * as m from "$paraglide/messages";
  import type { Snippet } from "svelte";
  import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";
  import LikeButton from "./LikeButton.svelte";
  import type { SuperValidated } from "sveltekit-superforms";
  import type { LikeSchema } from "./likes";
  import LikersList from "./LikersList.svelte";
  import Separator from "$lib/components/ui/separator/separator.svelte";
  import ArticleContent from "./ArticleContent.svelte";

  let {
    article,
    canEdit,
    canDelete,
    children,
    likeForm,
  }: {
    article: ExtendedPrismaModel<"Article"> & {
      tags: Array<ExtendedPrismaModel<"Tag">>;
      likers: Array<ExtendedPrismaModel<"Member">>;
    };
    canEdit: boolean;
    canDelete: boolean;
    children?: Snippet;
    likeForm: SuperValidated<LikeSchema>;
  } = $props();
</script>

<SetPageTitle title={article.header} />

<article class="flex flex-col gap-2">
  <ArticleContent {article}>
    {#snippet byline()}
      {@render children?.()}
    {/snippet}
    {#snippet headerActions()}
      {#if canEdit}<a href={"/news/" + article.slug + "/edit"}
          ><Button variant="outline"><Pen /></Button></a
        >{/if}
      {#if canDelete}{@render removeArticle()}{/if}
    {/snippet}
  </ArticleContent>

  <Separator class="mt-8" orientation="horizontal" />
  <LikeButton likers={article.likers} {likeForm} articleId={article.id} />
  <LikersList likers={article.likers} />
</article>

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
