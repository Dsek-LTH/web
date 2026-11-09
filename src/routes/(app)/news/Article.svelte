<script lang="ts">
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import { buttonVariants } from "$lib/components/ui/button";
  import Pen from "@lucide/svelte/icons/pen";
  import Trash from "@lucide/svelte/icons/trash";
  import Ellipsis from "@lucide/svelte/icons/ellipsis";
  import ArrowLeft from "@lucide/svelte/icons/arrow-left";
  import * as AlertDialog from "$lib/components/ui/alert-dialog";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
  import * as m from "$paraglide/messages";
  import type { Snippet } from "svelte";
  import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";
  import LikeButton from "./LikeButton.svelte";
  import type { SuperValidated } from "sveltekit-superforms";
  import type { LikeSchema } from "./likes";
  import LikersList from "./LikersList.svelte";
  import ArticleContent from "./ArticleContent.svelte";
  import { afterNavigate } from "$app/navigation";
  import { deLocalizeUrl } from "$paraglide/runtime";

  let {
    article,
    canEdit,
    canDelete,
    children,
    after,
    likeForm,
  }: {
    article: ExtendedPrismaModel<"Article"> & {
      tags: Array<ExtendedPrismaModel<"Tag">>;
      likers: Array<ExtendedPrismaModel<"Member">>;
    };
    canEdit: boolean;
    canDelete: boolean;
    /** The byline; receives the formatted publish date to place inside it. */
    children?: Snippet<[date: Snippet]>;
    /** Shown below the like list, for example the comment section. */
    after?: Snippet;
    likeForm: SuperValidated<LikeSchema>;
  } = $props();

  // Controlled so the dropdown item can open it; an AlertDialog nested in the menu would close with it.
  let deleteOpen = $state(false);

  // Without tags the title is the first thing under the back link (media always comes
  // later), so the link can sit tighter to it.
  let startsWithTitle = $derived(article.tags.length === 0);

  // When the reader came from the news list, going back should return them to the same
  // page, filters and scroll position instead of a fresh /news.
  let backHref = $state("/news");
  let cameFromList = $state(false);
  afterNavigate(({ from }) => {
    cameFromList = !!from && deLocalizeUrl(from.url).pathname === "/news";
    backHref =
      cameFromList && from ? from.url.pathname + from.url.search : "/news";
  });
</script>

<SetPageTitle title={article.header} />

<!-- Same width as the news list; body text keeps a readable line length through `prose`. -->
<article class="flex w-full flex-col">
  <a
    href={backHref}
    onclick={(event) => {
      const opensNewTab =
        event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0;
      if (!cameFromList || opensNewTab) return;
      // history.back() restores the list's scroll position, a fresh navigation would not.
      event.preventDefault();
      history.back();
    }}
    class="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-1.5 text-sm transition-colors {startsWithTitle
      ? 'mb-2'
      : 'mb-4'}"
  >
    <ArrowLeft class="size-4" />
    {m.news()}
  </a>

  <ArticleContent {article}>
    {#snippet byline(date)}
      {@render children?.(date)}
    {/snippet}
    {#snippet headerActions()}
      {#if canEdit || canDelete}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger
            class={buttonVariants({ variant: "ghost", size: "icon" })}
            aria-label={m.news_moreActions()}
          >
            <Ellipsis />
          </DropdownMenu.Trigger>
          <DropdownMenu.Content align="end">
            {#if canEdit}
              <DropdownMenu.Item>
                {#snippet child({ props })}
                  <a href="/news/{article.slug}/edit" {...props}>
                    <Pen />
                    {m.news_edit()}
                  </a>
                {/snippet}
              </DropdownMenu.Item>
            {/if}
            {#if canDelete}
              <DropdownMenu.Item
                variant="destructive"
                onSelect={() => (deleteOpen = true)}
              >
                <Trash />
                {m.news_delete()}
              </DropdownMenu.Item>
            {/if}
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      {/if}
    {/snippet}
  </ArticleContent>

  <div class="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 border-t pt-4">
    <LikeButton likers={article.likers} {likeForm} articleId={article.id} />
    <LikersList likers={article.likers} />
  </div>

  {#if after}
    <div class="mt-8">
      {@render after()}
    </div>
  {/if}
</article>

{#if canDelete}
  <AlertDialog.Root bind:open={deleteOpen}>
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
{/if}
