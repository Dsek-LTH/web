<script lang="ts">
  export let data;
</script>

{#if data.imageUrl}
  <figure>
    <img src={data.imageUrl} alt={data.header} />
  </figure>
{/if}

<main class="max-w-3xl mx-auto px-8 my-12">
  <h1 class="text-2xl font-bold mb-8">{data.header}</h1>

  <section class="flex border-y border-gray-600 py-4 items-center">
    <div class="avatar">
      <div class="w-16 rounded-full">
        <img src={data.author.member.picture_path} alt={data.author.member.first_name} />
      </div>
    </div>
    <div class="ml-4">
      <p class="font-semibold">{data.author.member.first_name} {data.author.member.last_name}</p>
      <p class="text-primary font-thin">Informationsansvarig</p>
    </div>
  </section>

  <section>
    <p class="text-gray-600 text-sm my-4">Publicerad {new Date(data.publishedDatetime).toLocaleDateString()}</p>
  </section>

  <article class="prose lg:prose-xl">
    <p>{data.body}</p>
  </article>
</main>
