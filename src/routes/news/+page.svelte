<script lang="ts">
  import apiNames from "$lib/apiNames.js";
  import TagChip from "$lib/components/TagChip.svelte";

  export let data;
</script>

<section class="flex flex-col gap-2">
  <div class="flex items-center gap-2">
    {#if data.accessPolicies.includes(apiNames.NEWS.CREATE)}
      <a class="btn" href="/news/create">+ Create</a>
    {/if}
    {#if data.accessPolicies.includes(apiNames.TAGS.CREATE) || data.accessPolicies.includes(apiNames.TAGS.UPDATE)}
      <a class="btn" href="/news/tags">Tags</a>
    {/if}
  </div>
  <form method="get" class="form-control flex-1">
    <input
      name="search"
      type="text"
      placeholder="Search"
      class="input input-bordered w-full focus:border-primary-focus"
    />
  </form>
</section>
{#each data.articles as article (article.id)}
  <article
    class="ease mdNEWS.CREATE8 my-4 rounded-2xl p-6 shadow-2xl ring-neutral-700 transition md:ring-1 md:hover:scale-105"
  >
    <div class="flex flex-row justify-between">
      <div class="flex items-center gap-3">
        <div class="avatar">
          <div class="w-10 rounded-full">
            <img src={article.author.member.picturePath} alt={article.author.member.firstName} />
          </div>
        </div>
        <div>
          <h3 class="text-sm font-semibold">
            {article.author.member.firstName + " " + article.author.member.lastName}
          </h3>
          {#if article.author.mandate?.position}
            <h3 class="text-sm font-thin text-primary">
              {article.author.mandate?.position.name}
            </h3>
          {/if}
        </div>
      </div>

      <p class="text-right text-xs text-gray-500">
        <!-- {new Date(article.publishedAt).toLocaleDateString(["sv"])} <br /> -->
        <!-- {new Date(article.publishedAt).toLocaleTimeString(["sv"], { -->
        <!-- hour: "2-digit", -->
        <!-- minute: "2-digit" -->
        <!-- })} -->
      </p>
    </div>

    <a href="/news/{article.slug}">
      <h2 class="my-3 text-2xl font-bold">{article.header}</h2>

      <div class="my-3 flex flex-row items-start gap-2">
        <p class="line-clamp-4 text-ellipsis">
          <!-- The article body is sanitized server-side. -->
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html article.body}
        </p>
        {#if article.imageUrl}
          <a href="/news/{article.slug}">
            <figure>
              <img class="rounded-2xl" src={article.imageUrl} alt={article.header} />
            </figure>
          </a>
        {/if}
      </div>
    </a>

    <div class="flex flex-row flex-wrap gap-2">
      {#each article.tags as tag}
        <a
          href="?tags={encodeURIComponent(tag.name)}"
          class="opacity-70 transition-opacity hover:opacity-100"
        >
          <TagChip {tag} />
        </a>
      {/each}
    </div>
  </article>
{/each}
