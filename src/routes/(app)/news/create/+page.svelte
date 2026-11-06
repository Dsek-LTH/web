<script lang="ts">
  import { type SuperForm, type SuperValidated } from "sveltekit-superforms";
  import ArticleEditor from "../ArticleEditor.svelte";
  import type { PageData } from "./$types";
  import { type ArticleSchema } from "$lib/news/schema";
  import { superForm } from "$lib/utils/client/superForms";
  import { Button } from "$lib/components/ui/button";
  import * as m from "$paraglide/messages";
  import ArrowLeft from "@lucide/svelte/icons/arrow-left";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";

  let { data }: { data: PageData } = $props();

  // svelte-ignore state_referenced_locally
  const superform = superForm(data.form, {
    dataType: "json",
    id: "createpage",
    delayMs: 500,
    // Superforms asks before any navigation (Back, Cancel, closing the tab) with unsaved changes.
    taintedMessage: m.news_unsavedChanges(),
  });
</script>

<SetPageTitle title={m.news_newArticle()} />

<div class="flex flex-col gap-2 pt-4 pb-6">
  <Button variant="ghost" href="/news" class="-ml-3 self-start">
    <ArrowLeft />
    {m.back()}
  </Button>
  <h1 class="text-3xl font-bold">{m.news_newArticle()}</h1>
</div>

<ArticleEditor
  allTags={data.allTags}
  authorOptions={data.authorOptions}
  data={data.form as unknown as SuperValidated<ArticleSchema>}
  superform={superform as unknown as SuperForm<ArticleSchema>}
  committees={data.committees}
  createdAt={data.createdAt}
  now={data.now}
/>
