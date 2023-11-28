<script lang="ts">
  import MarkdownBody from "$lib/components/MarkdownBody.svelte";
  import TagChip from "$lib/components/TagChip.svelte";
  import type { Article as ArticleType, Member, Tag } from "@prisma/client";
  import type { SuperValidated } from "sveltekit-superforms";
  import AuthorSignature from "./AuthorSignature.svelte";
  import LikeButton from "./LikeButton.svelte";
  import LikersList from "./LikersList.svelte";
  import type { AuthorOption } from "./articles";
  import type { LikeSchema } from "./likes";

  export let onTagClick: (tag: Tag) => void;
  export let article: ArticleType;
  export let author: AuthorOption;
  export let tags: Tag[];
  export let likers: Member[];
  export let commentCount: number;
  export let likeForm: SuperValidated<LikeSchema>;
</script>

<article
  class="ease my-4 rounded-lg p-6 shadow-2xl ring-neutral-700 transition md:ring-1 md:hover:scale-[1.01]"
>
  <a href="/news/{article.slug}">
    <h2 class="my-3 text-2xl font-bold">{article.header}</h2>
  </a>

  <div class="flex flex-row justify-between">
    <p class="text-right text-xs text-gray-500">
      {article.publishedAt?.toLocaleDateString(["sv"])}
      ,
      {article.publishedAt?.toLocaleTimeString(["sv"], {
        hour: "2-digit",
        minute: "2-digit",
      })}
    </p>
  </div>

  <div class="my-3 flex flex-row items-start gap-2">
    <MarkdownBody body={article.body.slice(0, 400)} class="line-clamp-4 text-ellipsis" />
    {#if article.imageUrl}
      <figure class="flex-1">
        <img class="rounded-2xl" src={article.imageUrl} alt={article.header} />
      </figure>
    {/if}
  </div>

  <div class="flex flex-row flex-wrap gap-2">
    {#each tags as tag}
      <a
        href="?tags={encodeURIComponent(tag.name)}"
        class="opacity-80 transition-opacity hover:opacity-100"
        on:click={() => onTagClick(tag)}
      >
        <TagChip {tag} />
      </a>
    {/each}
  </div>
  <div class="mt-2">
    <LikersList {likers} />
  </div>
  <div class="mt-4 flex flex-row flex-wrap items-start justify-between gap-2">
    <div class="flex flex-col gap-2">
      <LikersList {likers} />
      <LikeButton {likers} {likeForm} articleId={article.id} />
    </div>
    {#if commentCount > 0}
      <a
        href="/news/{article.slug}#comment-section"
        class="link text-sm opacity-40 hover:opacity-60"
      >
        {commentCount} kommentarer
      </a>
    {/if}
    <AuthorSignature
      member={author.member}
      position={author.mandate?.position}
      customAuthor={author.customAuthor ?? undefined}
      type={author.type}
    />
  </div>
</article>
