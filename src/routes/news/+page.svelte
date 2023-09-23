<script lang="ts">
    export let data;
</script>

<main class="max-w-3xl mx-auto px-8 flex flex-col divide-y divide-neutral-700">
	{#each data.articles as article}
    <a href="/news/{article.id}">
      <article class="my-8">
        {#if article.imageUrl}
          <figure>
            <img src={article.imageUrl} alt={article.header} />
          </figure>
        {/if}
        
        <div class="flex items-center gap-3">
          <div class="avatar">
            <div class="w-8 rounded-full">
              <img src={article.author.member.picture_path} alt={article.author.member.first_name} />
            </div>
          </div>
          <h3 class="text-sm font-semibold">{article.author.member.first_name + " " + article.author.member.last_name}</h3>
        </div>
        
        <h2 class="text-2xl font-bold my-3">{article.header}</h2>
        
        <div class="my-3">
          <p class="text-ellipsis line-clamp-4">
            {article.body || 'If a dog chews shoes whose shoes does he choose?'}
          </p>
        </div>

        <p class="text-xs text-gray-500">
          {new Date(article.publishedDatetime).toLocaleDateString()}
        </p>
      </article>
    </a>
	{/each}
</main>
