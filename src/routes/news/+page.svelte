<script lang="ts">
  export let data;
</script>

<main class="mx-auto flex max-w-3xl flex-col divide-y divide-neutral-700 px-8">
  {#each data.articles as article}
    <a href="/news/{article.id}">
      <article class="my-8">
        {#if article.imageUrl}
          <figure class="my-4">
            <img src={article.imageUrl} alt={article.header} />
          </figure>
        {/if}

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
          <p class="text-xs text-gray-500">
            {new Date(article.publishedDatetime).toLocaleDateString()}
          </p>
        </div>

        <h2 class="my-3 text-2xl font-bold">{article.header}</h2>

        <div class="my-3">
          <p class="line-clamp-4 text-ellipsis">
            <!-- The article body is sanitized server-side. -->
            <!-- eslint-disable-next-line svelte/no-at-html-tags -->
            {@html article.body}
          </p>
        </div>

        <div class="flex flex-col gap-2">
          <div class="flex flex-row flex-wrap gap-2">
            {#each article.tags as tag}
              <span class="rounded-full bg-base-200 p-1 text-xs text-gray-500">
                {tag.name}
              </span>
            {/each}
          </div>
        </div>
      </article>
    </a>
  {/each}
</main>
