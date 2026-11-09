<script lang="ts">
  import CommentSection from "$lib/components/comments/CommentSection.svelte";
  import ArticleByline from "../ArticleByline.svelte";
  import SEO from "$lib/seo/SEO.svelte";
  import Article from "../Article.svelte";

  let { data } = $props();

  let article = $derived(data.article);
</script>

<SEO
  data={{
    type: "article",
    article: {
      ...article,
      authorName: `${article.author.member.firstName} ${article.author.member.lastName}`,
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
      comments={article.comments}
      taggedMembers={data.allTaggedMembers}
      commentForm={data.commentForm}
      removeCommentForm={data.removeCommentForm}
    />
  {/snippet}
  {#snippet children(date)}
    <ArticleByline
      member={article.author.member}
      customAuthor={article.author.customAuthor}
      position={article.author.mandate?.position}
      type={article.author.type}
      committee={article.committee}
      {date}
    />
  {/snippet}
</Article>
