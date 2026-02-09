<script lang="ts">
  import { enhance } from "$app/forms";
  import SEO from "$lib/seo/SEO.svelte";
  import LoadingButton from "$lib/components/LoadingButton.svelte";
  import TagChip from "$lib/components/TagChip.svelte";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import AuthorSignature from "$lib/components/socials/AuthorSignature.svelte";
  import CommentSection from "$lib/components/socials/CommentSection.svelte";
  import { toast } from "$lib/stores/toast";
  import * as m from "$paraglide/messages";
  import Article from "../Article.svelte";
  import LikeButton from "../LikeButton.svelte";
  import LikersList from "../LikersList.svelte";

  let { data } = $props();

  let article = $state(data.article);
  let author = $state(article?.author);

  let isRemoving = $state(false);

  const shareData = $derived({
    title: article?.header ?? "pizza",
  });

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article?.header ?? "SOMETHING WENT TO SHIT!",
          url: window.location.href,
        });
      } catch (err) {
        console.error(err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareData.url);
        toast("Copied to clipboard.");
      } catch (err) {
        console.error(err);
      }
    }
  }
</script>

<SetPageTitle title={article.header} />

<SEO
  data={{
    type: "article",
    article: {
      ...article,
      authorName: `${author.member.firstName} ${author.member.lastName}`,
    },
  }}
/>

<article>
  <Article {article}>
    <AuthorSignature
      slot="author"
      member={author.member}
      position={author.mandate?.position}
      customAuthor={author.customAuthor}
      type={article.author.type}
    />

    <div slot="actions" class="flex flex-row">
      {#if data.canEdit}
        <!-- svelte-ignore a11y_consider_explicit_label -->
        <a
          href={`/news/${article.slug}/edit`}
          class="btn btn-square btn-ghost btn-md"
          title={m.news_edit()}
        >
          <span class="i-mdi-edit text-xl"></span>
        </a>
      {/if}
      {#if data.canDelete}
        <form
          method="POST"
          action="?/removeArticle"
          use:enhance={() => {
            isRemoving = true;
            return ({ update }) => {
              update();
              isRemoving = false;
            };
          }}
        >
          <LoadingButton
            isLoading={isRemoving}
            type="submit"
            class="btn btn-square btn-ghost btn-md"
            title={m.news_delete()}
          >
            <span class="i-mdi-delete text-xl"></span>
          </LoadingButton>
        </form>
      {/if}
    </div>

    <div slot="tags" class="flex flex-row flex-wrap gap-2">
      {#each article.tags as tag}
        <TagChip {tag} />
      {/each}
    </div>
    <div slot="after-body" class="mt-4">
      <div class="flex flex-row">
        <div class="flex flex-col items-start gap-2">
          <LikersList likers={article.likers} />
          <LikeButton
            likers={article.likers}
            likeForm={data.likeForm}
            articleId={article.id}
          />
        </div>
        <!-- share button -->
        <button
          type="button"
          onclick={share}
          class="i-mdi-share mt-2 size-12 hover:opacity-50 hover:transition-opacity"
        >
        </button>
      </div>
      <div class="mt-4 flex flex-col gap-2">
        <CommentSection
          type="NEWS"
          comments={article.comments}
          taggedMembers={data.allTaggedMembers}
          commentForm={data.commentForm}
          removeCommentForm={data.removeCommentForm}
        />
      </div>
    </div>
  </Article>
</article>
