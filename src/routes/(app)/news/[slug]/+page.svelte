<script>
  import AuthorCard from "$lib/components/AuthorCard.svelte";
  import CommitteeSymbol from "$lib/components/images/CommitteeSymbol.svelte";
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
      authorName: `${article.author.member.firstName} ${article.author.member.lastName}`,
    },
  }}
/>

<Article {article} canEdit={data.canEdit} canDelete={data.canDelete}
  ><div class="flex flex-row items-center gap-2">
    <AuthorCard
      member={article.author.member}
      customAuthor={article.author.customAuthor}
      position={article.author.mandate?.position}
    />{#if article.committee}<div class="bg-border h-8 w-px"></div>
      <div class="flex flex-row items-center gap-2">
        <CommitteeSymbol committee={article.committee} /><span
          class="text-muted-foreground">{article.committee.name}</span
        >
      </div>{/if}
  </div></Article
>
