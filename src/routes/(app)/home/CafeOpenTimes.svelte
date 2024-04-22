<script lang="ts">
  import type { Markdown } from "@prisma/client";
  import * as m from "$paraglide/messages";

  export let cafeOpen: Pick<Markdown, "markdown"> | null;
</script>

<a
  class="pop-out flex gap-6 rounded-2xl bg-base-300 p-6"
  href="/committees/cafe"
>
  <span class="i-mdi-coffee self-center text-2xl" />

  <article>
    <p>{m.landing_cafeOpenHours()}</p>
    <h2 class="text-xl font-bold">
      {#if cafeOpen}
        {cafeOpen.markdown}
      {:else}
        N/A
      {/if}
    </h2>
  </article>
</a>
