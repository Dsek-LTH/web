<script lang="ts">
  import dayjs from "dayjs";
  import AuthorCard from "./AuthorCard.svelte";
  import CommitteePlaceholder from "$lib/components/images/CommitteePlaceholder.svelte";
  import YoutubePreview from "./YoutubePreview.svelte";
  import { getYoutubeVideoId } from "$lib/utils/youtube";
  import { renderMarkdownExcerpt } from "$lib/utils/markdown";
  import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";

  let {
    article,
    index,
    isPreview = false,
  }: {
    article: {
      author: {
        member: Pick<
          ExtendedPrismaModel<"Member">,
          "firstName" | "lastName" | "nickname" | "studentId" | "picturePath"
        >;
        customAuthor: Pick<
          ExtendedPrismaModel<"CustomAuthor">,
          "name" | "imageUrl"
        > | null;
        mandate: {
          position: Pick<ExtendedPrismaModel<"Position">, "id" | "name">;
        } | null;
        type: ExtendedPrismaModel<"Author">["type"];
      };
      slug: string;
      imageUrl: string | null;
      header: string;
      body: string;
      createdAt: Date;
      committee: Pick<
        ExtendedPrismaModel<"Committee">,
        "shortName" | "symbolUrl" | "name"
      > | null;
      youtubeUrl: string | null;
    };
    index: number;
    isPreview?: boolean;
  } = $props();

  const videoId = $derived(getYoutubeVideoId(article.youtubeUrl));
  const articleUrl = $derived(`/news/${article.slug}`);
  const excerptHtml = $derived(renderMarkdownExcerpt(article.body));
  let failedImageUrl = $state<string | null>(null);
</script>

<div
  class="hover:bg-muted-background animate-in fade-in fill-mode-backwards slide-in-from-bottom-[2rem] border-border flex flex-col rounded-xl border-[1px] p-4 duration-300"
  style="animation-delay:{index * 50}ms"
>
  {#if videoId}
    {#key videoId}
      <YoutubePreview
        {videoId}
        title={article.header}
        imageUrl={article.imageUrl}
        committee={article.committee}
        class="aspect-[2/1] w-full shrink-0"
      />
    {/key}
  {:else}
    <svelte:element
      this={isPreview ? "div" : "a"}
      href={isPreview ? undefined : articleUrl}
      tabindex={isPreview ? undefined : -1}
      aria-hidden={isPreview ? undefined : "true"}
      class="block"
    >
      <!-- The placeholder stays underneath: a broken image paints nothing,
           and this also covers failures before hydration. -->
      <div
        class="bg-muted-background relative aspect-[2/1] w-full shrink-0 overflow-hidden rounded-md"
      >
        <div class="absolute inset-0" aria-hidden="true">
          <CommitteePlaceholder
            committee={article.committee}
            class="absolute inset-0"
          />
        </div>
        {#if article.imageUrl && failedImageUrl !== article.imageUrl}
          {@const url = article.imageUrl}
          {#key url}
            <img
              src={url}
              alt=""
              loading="lazy"
              class="absolute inset-0 size-full object-cover opacity-0"
              onload={(event) =>
                (event.currentTarget as HTMLImageElement).classList.replace(
                  "opacity-0",
                  "opacity-100",
                )}
              onerror={(event) =>
                (failedImageUrl = (
                  event.currentTarget as HTMLImageElement
                ).getAttribute("src"))}
            />
          {/key}
        {/if}
      </div>
    </svelte:element>
  {/if}
  <svelte:element
    this={isPreview ? "div" : "a"}
    href={isPreview ? undefined : articleUrl}
    class="block"
  >
    <h3 class="mt-2 px-2 break-words">
      {article.header}
    </h3>
    <div class="prose-p:text-foreground line-clamp-2 px-2 overflow-ellipsis">
      <!-- eslint-disable-next-line svelte/no-at-html-tags -- Sanitized by renderMarkdownExcerpt -->
      {@html excerptHtml}
    </div></svelte:element
  >
  <div class="mt-auto flex flex-row items-center justify-between pt-2">
    <AuthorCard
      member={article.author.member}
      customAuthor={article.author.customAuthor}
      position={article.author.mandate?.position}
      type={article.author.type}
      links={!isPreview}
    />
    <span class="text-muted-foreground"
      >{dayjs(article.createdAt).format("YYYY-MM-DD")}</span
    >
  </div>
</div>
