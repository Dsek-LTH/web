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
  import ArticleSearchResult from "./ArticleSearchResult.svelte";
  import CommandArticleSearchResult from "$lib/components/search/ArticleSearchResult.svelte";
  import * as Command from "$lib/components/ui/command";
  import type { CommitteeOption } from "$lib/news/committees";
  import { buildArticlePreview } from "$lib/news/preview";
  import * as m from "$paraglide/messages";

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

  const previewSearchResult = $derived({
    headerSv: $form.headerSv,
    headerEn: $form.headerEn,
    bodySv: $form.bodySv ?? "",
    bodyEn: $form.bodyEn,
    slug: "",
    publishedAt: preview.cardPublishedAt,
    author: $form.author.member,
  });
</script>

<div class="flex min-w-0 flex-col gap-4 sm:flex-row sm:*:w-1/2 sm:*:min-w-0">
  <ArticleForm
    bind:activeTab
    {authorOptions}
    {superform}
    {allTags}
    {committees}
    action={formAction}
  />
  <section class="flex min-w-0 flex-col gap-6">
    <div class="flex min-w-0 flex-col gap-3">
      <h2 class="text-lg font-semibold">{m.news_preview()}</h2>
      <ArticleContent article={preview.article}>
        {#snippet byline()}
          <ArticleByline
            links={false}
            member={$form.author.member}
            position={$form.author.mandate?.position}
            customAuthor={$form.author.customAuthor}
            type={$form.author.type}
            committee={preview.committee}
          />
        {/snippet}
      </ArticleContent>
    </div>

    <div class="border-border flex min-w-0 flex-col gap-5 border-t pt-6">
      <div class="flex flex-col gap-1">
        <h3 class="text-base font-semibold">{m.news_appearances()}</h3>
        <p class="text-muted-foreground text-sm">
          {m.news_appearances_description()}
        </p>
      </div>

      <div class="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div class="flex min-w-0 flex-col gap-3">
          <h4
            class="text-muted-foreground text-xs font-semibold tracking-wide uppercase"
          >
            {m.news_home_card_preview()}
          </h4>
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
        </div>
        <div class="flex min-w-0 flex-col gap-3">
          <h4
            class="text-muted-foreground text-xs font-semibold tracking-wide uppercase"
          >
            {m.news_listing_preview()}
          </h4>
          <ArticleCard article={previewCardArticle} index={0} isPreview />
        </div>
      </div>

      <div class="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div class="flex min-w-0 flex-col gap-3">
          <h4
            class="text-muted-foreground text-xs font-semibold tracking-wide uppercase"
          >
            {m.news_search_preview()}
          </h4>
          <ArticleSearchResult
            data={previewSearchResult}
            language={activeTab}
            isPreview
          />
        </div>
        <div class="flex min-w-0 flex-col gap-3">
          <h4
            class="text-muted-foreground text-xs font-semibold tracking-wide uppercase"
          >
            {m.news_command_preview()}
          </h4>
          <Command.Root class="border-border rounded-lg border-[1px]">
            <Command.List>
              <Command.Group>
                <CommandArticleSearchResult
                  data={previewSearchResult}
                  language={activeTab}
                  isPreview
                />
              </Command.Group>
            </Command.List>
          </Command.Root>
        </div>
      </div>
    </div>
  </section>
</div>
