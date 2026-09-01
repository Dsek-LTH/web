<script lang="ts">
  import ArticleEditor from "../../ArticleEditor.svelte";
  import type { PageData } from "./$types";
  import { superForm } from "$lib/utils/client/superForms";
  import type { ArticleSchema } from "$lib/news/schema";
  import type { SuperForm } from "sveltekit-superforms";
  import { buttonVariants } from "$lib/components/ui/button";
  import Trash from "@lucide/svelte/icons/trash";
  import * as m from "$paraglide/messages";
  import RemoveArticleDialog from "../../RemoveArticleDialog.svelte";

  let { data }: { data: PageData } = $props();

  // svelte-ignore state_referenced_locally
  const superform = superForm(data.form, {
    dataType: "json",
    delayMs: 500,
  });
</script>

<ArticleEditor
  allTags={data.allTags}
  authorOptions={data.authorOptions}
  data={data.form}
  superform={superform as unknown as SuperForm<ArticleSchema>}
  committees={data.committees}
  formAction="?/update"
/>

{#if data.canDelete}
  <div class="mt-8 flex justify-end border-t pt-6">
    <RemoveArticleDialog
      slug={data.form.data.slug}
      triggerClass={buttonVariants({ variant: "destructive" })}
    >
      <Trash class="mr-2 size-4" />
      {m.news_delete()}
    </RemoveArticleDialog>
  </div>
{/if}
