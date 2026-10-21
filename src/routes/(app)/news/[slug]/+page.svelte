<script lang="ts">
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import SEO from "$lib/seo/SEO.svelte";
  import Article from "../Article.svelte";
  import ArticleByline from "../ArticleByline.svelte";

  let { data } = $props();

  let article = $derived(data.article);
</script>

<SetPageTitle title={article.header} />

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
  <ArticleByline
    member={article.author.member}
    customAuthor={article.author.customAuthor}
    position={article.author.mandate?.position}
    type={article.author.type}
    committee={article.committee}
  />
</Article>
