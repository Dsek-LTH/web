<script lang="ts">
  import type { Markdown } from "@prisma/client";
  import * as m from "$paraglide/messages";

  interface Props {
    cafeOpen: Pick<Markdown, "markdown"> | null;
  }

  let { cafeOpen }: Props = $props();
</script>

<a
  class="pop-out flex gap-6 rounded-2xl bg-base-300 px-6 py-3"
  href="/committees/cafe"
>
  <span class="i-mdi-coffee self-center text-2xl text-secondary lg:text-primary"
  ></span>

  <article>
    <p>{m.home_cafeOpenHours()}</p>
    <h2 class="text-xl font-bold text-secondary lg:text-primary">
      {#if cafeOpen}
        {cafeOpen.markdown}
      {:else}
        N/A
      {/if}
    </h2>
  </article>
</a>
