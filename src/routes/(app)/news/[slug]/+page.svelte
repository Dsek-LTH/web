<script>
  import AuthorCard from "$lib/components/AuthorCard.svelte";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import SEO from "$lib/seo/SEO.svelte";
  import Article from "../Article.svelte";

  let { data } = $props();

  // svelte-ignore state_referenced_locally
  let article = $state(data.article);
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

<Article {article} canEdit={data.canEdit} canDelete={data.canDelete}
  ><AuthorCard
    member={article.author.member}
    customAuthor={article.author.customAuthor}
    position={article.author.mandate?.position}
  /></Article
>
