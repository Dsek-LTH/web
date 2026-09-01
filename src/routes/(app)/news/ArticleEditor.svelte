<script lang="ts">
  import type { SuperForm, SuperValidated } from "sveltekit-superforms";
  import Article from "./Article.svelte";
  import ArticleForm from "./ArticleForm.svelte";
  import type { ArticleSchema } from "$lib/news/schema";
  import { superForm } from "$lib/utils/client/superForms";
  import AuthorCard from "$lib/components/AuthorCard.svelte";
  import type { components } from "$lib/api/schema";
  import type { AuthorOptionSchema } from "$lib/news/schema";

  let {
    data,
    allTags,
    authorOptions,
    superform = superForm(data, { dataType: "json", delayMs: 500 }),
    committees,
    formAction,
  }: {
    allTags: Array<components["schemas"]["Tag"]>;
    authorOptions: AuthorOptionSchema[];
    data: SuperValidated<ArticleSchema>;
    superform?: SuperForm<ArticleSchema>;
    committees: Array<Pick<components["schemas"]["Committee"], "id" | "name">>;
    formAction?: string;
  } = $props();

  const { form } = $derived(superform);
  let activeTab: "sv" | "en" = $state("sv");

  let tagIds = $form.tags
    .values()
    .toArray()
    .flat()
    .map((t) => t.id);
</script>

<div class="flex flex-col gap-4 sm:flex-row sm:*:w-1/2">
  <ArticleForm
    bind:activeTab
    {authorOptions}
    {superform}
    {allTags}
    {committees}
    action={formAction}
  />
  <Article
    article={{
      slug: "",
      header:
        activeTab === "en" && $form.headerEn ? $form.headerEn : $form.headerSv,
      body: activeTab === "en" && $form.bodyEn ? $form.bodyEn : $form.bodySv,
      createdAt: new Date().toISOString(),
      imageUrls: $form.imageUrls ?? [],
      tags: allTags.filter((t) => tagIds.includes(t.id)),
    }}
    canEdit={false}
    canDelete={false}
  >
    <AuthorCard links={false} author={$form.author} /></Article
  >
</div>
