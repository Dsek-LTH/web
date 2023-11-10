<script lang="ts">
  export let data;
</script>

{#each data.songs as song}
  <article class="my-4 p-6 rounded-lg ring-neutral-700 shadow-2xl md:ring-1">

    <div class="flex justify-between">
      <h2 class="my-3 text-2xl font-bold">
        {song.title}
      </h2>

      <p class="text-right text-xs text-gray-500">
        {song.createdAt?.toLocaleDateString(["sv"])} <br />
        {song.createdAt?.toLocaleTimeString(["sv"], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>
    </div>

    <h3 class="text-gray-500 text-lg mb-4 italic">
      {song.category}
    </h3>

    <p class="mb-4">Melodi: {song.melody}</p>
    <p class="whitespace-pre-line">{song.lyrics}</p>
  </article>
{/each}
