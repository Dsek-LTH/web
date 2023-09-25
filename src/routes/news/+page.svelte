<script lang="ts">
    export let data;
</script>

<main class="max-w-3xl mx-auto px-8 flex flex-col divide-y divide-neutral-700">
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
                <img src={article.author.member.picture_path} alt={article.author.member.first_name} />
              </div>
            </div>
            
            <div>
              <h3 class="text-sm font-semibold">{article.author.member.first_name + " " + article.author.member.last_name}</h3>
              {#if  article.author.mandate?.position.name}
                <h3 class="text-sm font-thin text-primary">{article.author.mandate?.position.name}</h3>
              {/if}
            </div>
          </div>
          <p class="text-xs text-gray-500">
            {new Date(article.publishedDatetime).toLocaleDateString()}
          </p>
        </div>
        
        <h2 class="text-2xl font-bold my-3">{article.header}</h2>
        
        <div class="my-3">
          <p class="text-ellipsis line-clamp-4">
            {@html article.body}
          </p>
        </div>

        
        <div class="flex flex-col gap-2">
          <div class="flex flex-row flex-wrap gap-2">
            {#each article.tags as tag}
              <span class="text-xs text-gray-500 bg-base-200 rounded-full p-1">
                {tag.name}
              </span>
            {/each}
          </div>
        </div>
      </article>
    </a>
	{/each}
</main>
