<script lang="ts">
  import type { SuperForm, SuperValidated } from "sveltekit-superforms";
  import Article from "./Article.svelte";
  import ArticleForm from "./ArticleForm.svelte";
  import type { ArticleSchema } from "$lib/news/schema";
  import { superForm } from "$lib/utils/client/superForms";
  import AuthorCard from "$lib/components/AuthorCard.svelte";
  import type { AuthorOption } from "$lib/news/getArticles";
  import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";
  import type { Snippet } from "svelte";

  let {
    data,
    allTags,
    authorOptions,
    superform = superForm(data, { dataType: "json" }),
    formEnd,
  }: {
    allTags: Array<ExtendedPrismaModel<"Tag">>;
    authorOptions: AuthorOption[];
    data: SuperValidated<ArticleSchema>;
    superform?: SuperForm<ArticleSchema>;
    formEnd?: Snippet;
  } = $props();

  const { form } = superform;
  let activeTab: "sv" | "en" = $state("sv");

  let tagIds = $form.tags
    .values()
    .toArray()
    .flat()
    .map((t) => t.id);
</script>

<div class="flex flex-row gap-4 *:w-1/2">
  <ArticleForm bind:activeTab {authorOptions} {superform} {allTags} {formEnd} />
  <Article
    article={{
      id: "",
      slug: "",
      header:
        activeTab === "en" && $form.headerEn ? $form.headerEn : $form.headerSv,
      headerSv: $form.headerSv,
      headerEn: $form.headerEn,
      body: activeTab === "en" && $form.bodyEn ? $form.bodyEn : $form.bodySv,
      bodySv: $form.bodySv,
      bodyEn: $form.bodyEn,
      authorId: $form.author.id,
      publishedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      removedAt: null,
      status: "draft",
      imageUrls: $form.imageUrls ?? [],
      imageUrl: $form.imageUrl ?? null,
      youtubeUrl: $form.youtubeUrl ?? null,
      tags: allTags.filter((t) => tagIds.includes(t.id)),
    }}
    canEdit={false}
    canDelete={false}
  >
    <AuthorCard
      links={false}
      member={$form.author.member}
      position={$form.author.mandate?.position}
      customAuthor={$form.author.customAuthor}
      type={$form.author.type}
    /></Article
  >
</div>
