<script lang="ts">
  import * as AlertDialog from "$lib/components/ui/alert-dialog";
  import * as m from "$paraglide/messages";
  import { api } from "$lib/api/client";
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { toast } from "$lib/stores/toast";
  import type { Snippet } from "svelte";

  // Pure-proxy mutation (see DESIGN.md's "Principles going forward" #5):
  // calls the Go API directly from the client, no SvelteKit server action,
  // no zod - Go's own auth.Require(apinames.NewsArticleDelete)/author
  // bypass is the only real gate either way (see
  // backend/internal/articles.Service.Delete).
  let {
    slug,
    triggerClass,
    children,
  }: { slug: string; triggerClass?: string; children: Snippet } = $props();

  let open = $state(false);

  async function removeArticle() {
    const res = await api.DELETE("/articles/{slug}", {
      params: { path: { slug } },
    });
    if (res.error) {
      toast(
        res.response.status === 404
          ? m.news_errors_articleNotFound()
          : "Failed to delete article",
        "error",
      );
      return;
    }
    open = false;
    toast(m.news_articleDeleted(), "success");
    await goto(resolve("/news"));
  }
</script>

<AlertDialog.Root bind:open>
  <AlertDialog.Trigger class={triggerClass}>
    {@render children()}
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
      <AlertDialog.Action onclick={removeArticle}
        >{m.news_delete()}</AlertDialog.Action
      >
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
