<script lang="ts">
  import ArticleEditor from "../../ArticleEditor.svelte";
  import type { PageData } from "./$types";
  import { superForm } from "$lib/utils/client/superForms";
  import type { ArticleSchema } from "$lib/news/schema";
  import type { SuperForm } from "sveltekit-superforms";
  import { buttonVariants } from "$lib/components/ui/button";
  import * as AlertDialog from "$lib/components/ui/alert-dialog";
  import Trash from "@lucide/svelte/icons/trash";
  import * as m from "$paraglide/messages";
  import { Button } from "$lib/components/ui/button";
  import ArrowLeft from "@lucide/svelte/icons/arrow-left";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";

  let { data }: { data: PageData } = $props();

  // svelte-ignore state_referenced_locally
  const superform = superForm(data.form, {
    dataType: "json",
    delayMs: 500,
    // Superforms asks before any navigation (Back, Cancel, closing the tab) with unsaved changes.
    taintedMessage: m.news_unsavedChanges(),
  });
</script>

<SetPageTitle title={m.news_editArticle()} />

<div class="flex flex-col gap-2 pt-4 pb-6">
  <Button variant="ghost" href="/news/{data.slug}" class="-ml-3 self-start">
    <ArrowLeft />
    {m.back()}
  </Button>
  <h1 class="text-3xl font-bold">{m.news_editArticle()}</h1>
</div>

<ArticleEditor
  allTags={data.allTags}
  authorOptions={data.authorOptions}
  data={data.form}
  superform={superform as unknown as SuperForm<ArticleSchema>}
  committees={data.committees}
  createdAt={data.createdAt}
  now={data.now}
  isEditing
  formAction="?/update"
  cancelHref="/news/{data.slug}"
/>

{#if data.canDelete}
  <div class="mt-8 flex justify-end border-t pt-6">
    <AlertDialog.Root>
      <AlertDialog.Trigger class={buttonVariants({ variant: "destructive" })}>
        <Trash class="mr-2 size-4" />
        {m.news_delete()}
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
  </div>
{/if}
