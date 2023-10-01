<script lang="ts">
  export let data;
</script>

{#if data.imageUrl}
  <figure>
    <img class="mx-auto" src={data.imageUrl} alt={data.header} />
  </figure>
{/if}

<main class="mx-auto my-12 max-w-3xl px-8">
  <h1 class="mb-8 text-2xl font-bold">{data.header}</h1>

  <section class="flex items-center border-y border-gray-600 py-4">
    <div class="avatar">
      <div class="w-16 rounded-full">
        <img src={data.author.member.picture_path} alt={data.author.member.first_name} />
      </div>
    </div>
    <div class="ml-4">
      <p class="font-semibold">{data.author.member.first_name} {data.author.member.last_name}</p>
      <p class="font-thin text-primary">Informationsansvarig</p>
    </div>
  </section>

  <section>
    <p class="my-4 text-sm text-gray-600">
      Publicerad {new Date(data.publishedDatetime).toLocaleDateString()}
    </p>
  </section>

  <article class="prose lg:prose-xl">
    <p>{@html data.body}</p>
  </article>
</main>
