<script lang="ts">
  export let data;
</script>

<main class="mx-auto max-w-3xl">
  <form method="get" class="form-control mx-4 mt-8">
    <input
      name="search"
      type="text"
      placeholder="Search"
      class="input input-bordered w-full focus:border-primary-focus"
    />
  </form>
  {#each data.articles as article (article.id)}
    <article
      class="ease my-4 rounded-2xl p-6 shadow-2xl ring-neutral-700 transition md:my-8 md:p-8 md:ring-1 md:hover:scale-105"
    >
      <div class="flex flex-row justify-between">
        <div class="flex items-center gap-3">
          <div class="avatar">
            <div class="w-10 rounded-full">
              <img
                src={article.author.member.picture_path}
                alt={article.author.member.first_name}
              />
            </div>
          </div>
          <div>
            <h3 class="text-sm font-semibold">
              {article.author.member.first_name + " " + article.author.member.last_name}
            </h3>
            {#if article.author.mandate?.position.name}
              <h3 class="text-sm font-thin text-primary">
                {article.author.mandate?.position.name}
              </h3>
            {/if}
          </div>
        </div>

        <p class="text-right text-xs text-gray-500">
          {new Date(article.publishedDatetime).toLocaleDateString(["sv"])} <br />
          {new Date(article.publishedDatetime).toLocaleTimeString(["sv"], {
            hour: "2-digit",
            minute: "2-digit"
          })}
        </p>
      </div>

      <a href="/news/{article.id}">
        <h2 class="my-3 text-2xl font-bold">{article.header}</h2>

        <div class="my-3 flex flex-row items-start gap-2">
          <p class="line-clamp-4 text-ellipsis">
            <!-- The article body is sanitized server-side. -->
            <!-- eslint-disable-next-line svelte/no-at-html-tags -->
            {@html article.body}
          </p>
          {#if article.imageUrl}
            <a href="/news/{article.id}">
              <figure>
                <img class="rounded-2xl" src={article.imageUrl} alt={article.header} />
              </figure>
            </a>
          {/if}
        </div>
      </a>

      <div class="flex flex-row flex-wrap gap-2">
        {#each article.tags as tag}
          <span class="badge badge-md" style="border-color: {tag.color}">
            {tag.name}
          </span>
        {/each}
      </div>
    </article>
  {/each}
</main>
