<script lang="ts">
  export let data;
  $: article = data.article!;
</script>

<!-- {#if data.imageUrl}
  <figure>
    <img class="mx-auto" src={data.imageUrl} alt={data.header} />
  </figure>
{/if} -->

<main class="mx-auto my-12 max-w-3xl px-8">
  <h1 class="mb-8 text-2xl font-bold">{article.header}</h1>

  <section class="flex items-center border-y border-gray-600 py-4">
    <!-- <div class="avatar">
      <div class="w-16 rounded-full">
        <img src={article.author.member.picture_path} alt={article.author.member.first_name} />
      </div>
    </div> -->
    <div class="ml-4">
      <p class="font-semibold">
        {article.author.member.firstName}
        {article.author.member.lastName}
      </p>
      <p class="font-thin text-primary">Informationsansvarig</p>
    </div>
  </section>

  <section>
    <p class="my-4 text-sm text-gray-600">
      <!-- Publicerad {new Date(article.publishedAt).toLocaleDateString()} -->
    </p>
  </section>

  <article class="prose lg:prose-xl">
    <!-- The article body is sanitized server-side. -->
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@html article.body}
  </article>
</main>
