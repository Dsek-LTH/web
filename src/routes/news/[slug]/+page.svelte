<script lang="ts">
  import TagChip from "$lib/components/TagChip.svelte";
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
  </Article>
</article>
