<script lang="ts">
  import type { SuperForm, SuperValidated } from "sveltekit-superforms";
  import ArticleForm from "./ArticleForm.svelte";
  import type { ArticleSchema } from "$lib/news/schema";
  import { superForm } from "$lib/utils/client/superForms";
  import type { AuthorOption } from "$lib/news/getArticles";
  import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";
  import ArticleSmallCard from "$lib/components/ArticleSmallCard.svelte";
  import * as m from "$paraglide/messages";

  let {
    data,
    allTags,
    authorOptions,
    superform = superForm(data, { dataType: "json", delayMs: 500 }),
    committees,
    formAction,
  }: {
    allTags: Array<ExtendedPrismaModel<"Tag">>;
    authorOptions: AuthorOption[];
    data: SuperValidated<ArticleSchema>;
    superform?: SuperForm<ArticleSchema>;
    committees: Array<Pick<ExtendedPrismaModel<"Committee">, "id" | "name">>;
    formAction?: string;
  } = $props();

  const { form } = $derived(superform);
  let activeTab: "sv" | "en" = $state("sv");

  const images = $derived($form.images);
  let uploadedImageUrl: string | null = $state(null);
  $effect(() => {
    const image = images?.[0];

    if (!image) {
      uploadedImageUrl = null;
      return;
    }

    const url = URL.createObjectURL(image);
    uploadedImageUrl = url;

    return () => URL.revokeObjectURL(url);
  });
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
  <section class="flex flex-col gap-2">
    <span class="text-muted-foreground italic">{m.events_create_preview()}</span
    >
    <ArticleSmallCard
      article={{
        slug: "",
        header:
          activeTab === "en" && $form.headerEn
            ? $form.headerEn
            : $form.headerSv,
        publishedAt: new Date(),
        imageUrl: uploadedImageUrl ?? $form.imageUrls?.[0] ?? null,
        committee: null,
      }}
      isPreview={true}
      index={0}
    />
  </section>
</div>
