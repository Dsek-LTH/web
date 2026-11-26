<script lang="ts">
  import CommentSection from "$lib/components/comments/CommentSection.svelte";
  import ArticleByline from "../ArticleByline.svelte";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import SEO from "$lib/seo/SEO.svelte";
  import Article from "../Article.svelte";

  let { data } = $props();

  let article = $derived(data.article);
</script>

<SetPageTitle title={article.header} />

<SEO
  data={{
    type: "article",
    article: {
      ...article,
      publishedAt: article.publishedAt ? new Date(article.publishedAt) : null,
      updatedAt: article.updatedAt ? new Date(article.updatedAt) : null,
      imageUrl: article.imageUrl ?? null,
      // A custom byline's name; otherwise the member's, which is blank
      // for a staben byline hidden during nollning.
      authorName:
        article.author.customAuthor?.name ??
        [article.author.member.firstName, article.author.member.lastName]
          .filter(Boolean)
          .join(" "),
    },
  }}
/>

<Article
  {article}
  likeForm={data.likeForm}
  canEdit={data.canEdit}
  canDelete={data.canDelete}
>
  {#snippet after()}
    <CommentSection
      type="NEWS"
      comments={article.comments ?? []}
      taggedMembers={data.allTaggedMembers}
      commentForm={data.commentForm}
      removeCommentForm={data.removeCommentForm}
    />
  {/snippet}
  <ArticleByline author={article.author} committee={article.committee} />
</Article>
