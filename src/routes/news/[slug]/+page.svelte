<script lang="ts">
  import TagChip from "$lib/components/TagChip.svelte";
  import LikeButton from "../LikeButton.svelte";
  import LikersList from "../LikersList.svelte";
  import apiNames from "$lib/utils/apiNames";
  import Article from "../Article.svelte";
  import AuthorSignature from "../AuthorSignature.svelte";

  export let data;
  $: article = data.article;
  $: author = article.author;
</script>

<article>
  <Article {article}>
    <AuthorSignature
      slot="author"
      member={author.member}
      position={author.mandate?.position}
      customAuthor={author.customAuthor ?? undefined}
      type={article.author.type}
    />

    <div slot="actions">
      {#if data.canEdit}
        <a class="text-primary hover:underline" href={`/news/${article.slug}/edit`}> Redigera </a>
      {/if}
    </div>

    <div slot="tags" class="flex flex-row flex-wrap gap-2">
      {#each article.tags as tag}
        <TagChip {tag} />
      {/each}
    </div>

    <div slot="after-body" class="mt-4 flex flex-col items-start gap-2">
      <LikersList likers={article.likers} />
      <LikeButton
        likers={article.likers}
        disabled={!data.accessPolicies.includes(apiNames.NEWS.LIKE)}
      >
        <input slot="hidden-input" type="hidden" value={article.id} name="articleId" />
      </LikeButton>
    </div>
  </Article>
</article>
