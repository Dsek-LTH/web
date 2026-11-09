<script lang="ts">
  import { untrack } from "svelte";
  import type { SuperForm, SuperValidated } from "sveltekit-superforms";
  import ArticleForm from "./ArticleForm.svelte";
  import ArticleContent from "./ArticleContent.svelte";
  import ArticleByline from "./ArticleByline.svelte";
  import type { ArticleSchema } from "$lib/news/schema";
  import { superForm } from "$lib/utils/client/superForms";
  import type { AuthorOption } from "$lib/news/getArticles";
  import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";
  import ArticleSmallCard from "$lib/components/ArticleSmallCard.svelte";
  import ArticleCard from "$lib/components/ArticleCard.svelte";
  import type { CommitteeOption } from "$lib/news/committees";
  import { buildArticlePreview } from "$lib/news/preview";
  import * as m from "$paraglide/messages";
  import * as Tabs from "$lib/components/ui/tabs";

  let {
    data,
    allTags,
    authorOptions,
    superform = superForm(data, { dataType: "json", delayMs: 500 }),
    committees,
    createdAt,
    now,
    isEditing = false,
    formAction,
    cancelHref = "/news",
  }: {
    allTags: Array<ExtendedPrismaModel<"Tag">>;
    authorOptions: AuthorOption[];
    data: SuperValidated<ArticleSchema>;
    superform?: SuperForm<ArticleSchema>;
    committees: CommitteeOption[];
    createdAt: Date;
    now: Date;
    isEditing?: boolean;
    formAction?: string;
    cancelHref?: string;
  } = $props();

  const { form } = $derived(superform);
  let activeTab: "sv" | "en" = $state("sv");

  const images = $derived($form.images ?? []);
  const imagesKey = $derived(
    images
      .map((file) => `${file.name}:${file.size}:${file.lastModified}`)
      .join("|"),
  );

  let uploadedImageUrls = $state.raw<string[]>([]);
  $effect(() => {
    // Depend on the file set, not the form array identity. Superforms clones
    // the form on every write, so reacting to the array itself would recreate
    // and revoke object URLs on every keystroke.
    const signature = imagesKey;
    const files = untrack(() => images).filter((file) => file instanceof File);

    if (signature === "" || files.length === 0) {
      uploadedImageUrls = [];
      return;
    }

    const urls = files.map((file) => URL.createObjectURL(file));
    uploadedImageUrls = urls;

    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  });

  const preview = $derived(
    buildArticlePreview({
      form: $form,
      tags: allTags,
      committees,
      language: activeTab,
      createdAt,
      now,
      uploadedImageUrls,
      isEditing,
    }),
  );

  const previewCardArticle = $derived({
    author: {
      member: $form.author.member,
      customAuthor: $form.author.customAuthor,
      mandate: $form.author.mandate,
      type: $form.author.type,
    },
    slug: "",
    imageUrl: preview.cardImageUrl,
    header: preview.article.header,
    body: preview.article.body,
    createdAt: preview.article.createdAt,
    committee: preview.committee,
    youtubeUrl: $form.youtubeUrl ?? null,
  });
</script>

<!-- Side by side only from lg: below that both columns are too narrow to be useful. -->
<div class="grid min-w-0 grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-10">
  <ArticleForm
    bind:activeTab
    {authorOptions}
    {superform}
    {allTags}
    {committees}
    {isEditing}
    {cancelHref}
    imageFileUrls={uploadedImageUrls}
    action={formAction}
  />
  <!-- Sticky on wide screens so the preview stays visible while editing a long form.
       top-24 clears the sticky site header. -->
  <section
    class="flex min-w-0 flex-col gap-3 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto"
  >
    <Tabs.Root value="article" class="min-w-0 gap-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h2 class="text-lg">{m.news_preview()}</h2>
        <Tabs.List>
          <Tabs.Trigger value="article">{m.news_preview_article()}</Tabs.Trigger
          >
          <Tabs.Trigger value="news">{m.news_listing_preview()}</Tabs.Trigger>
          <Tabs.Trigger value="home">{m.news_home_card_preview()}</Tabs.Trigger>
        </Tabs.List>
      </div>

      <Tabs.Content value="article" class="min-w-0">
        <ArticleContent
          article={{
            ...preview.article,
            imageUrl: preview.cardImageUrl,
            publishedAt: preview.cardPublishedAt,
          }}
          isPreview
        >
          {#snippet byline(date)}
            <ArticleByline
              links={false}
              member={$form.author.member}
              position={$form.author.mandate?.position}
              customAuthor={$form.author.customAuthor}
              type={$form.author.type}
              committee={preview.committee}
              {date}
            />
          {/snippet}
        </ArticleContent>
      </Tabs.Content>

      <!-- Same card as the /news grid, at roughly one grid column's width. -->
      <Tabs.Content value="news" class="min-w-0">
        <div class="max-w-sm">
          <ArticleCard
            article={previewCardArticle}
            index={0}
            isPreview
            variant="editorial"
            tags={preview.article.tags}
          />
        </div>
      </Tabs.Content>

      <!-- The home page shows four cards per row on lg; half of this half-width column matches that. -->
      <Tabs.Content value="home" class="min-w-0 lg:w-1/2">
        <ArticleSmallCard
          article={{
            slug: "",
            header: preview.article.header,
            publishedAt: preview.cardPublishedAt,
            imageUrl: preview.cardImageUrl,
            committee: preview.committee,
            youtubeUrl: $form.youtubeUrl ?? null,
          }}
          isPreview={true}
        />
      </Tabs.Content>
    </Tabs.Root>
  </section>
</div>
