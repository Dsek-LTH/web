<script lang="ts">
  import type { Markdown } from "@prisma/client";

  export let cafeOpen: Pick<Markdown, "markdown"> | null;
</script>

<a
  class="flex cursor-pointer gap-6 bg-base-300 p-6 transition-all duration-200 hover:-translate-x-1 hover:-translate-y-1 hover:bg-base-200 hover:shadow-xl"
  href="/committees/cafe"
>
  <span class="i-mdi-coffee self-center text-2xl" />

  <article>
    <p>Caféets öppettider</p>
    <h2 class="text-xl font-bold">
      {#if cafeOpen}
        {cafeOpen.markdown}
      {:else}
        N/A
      {/if}
    </h2>
  </article>
</a>
