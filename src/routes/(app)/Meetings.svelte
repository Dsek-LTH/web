<script lang="ts">
  import type { Meeting } from "@prisma/client";
  import * as m from "$paraglide/messages";
  export let upcoming: Pick<Meeting, "title"> | null;
  export let previous: Pick<Meeting, "title"> | null;
</script>

<a
  class="flex cursor-pointer gap-6 rounded-lg bg-base-300 p-6 transition-all duration-200 hover:-translate-x-1 hover:-translate-y-1 hover:bg-base-200 hover:shadow-xl"
  href="/documents"
>
  <span class="i-mdi-gavel self-center text-2xl" />

  <article class="flex-1">
    <p>{m.landing_meetingNext()}</p>
    <h2 class="text-xl font-bold">
      {#if upcoming}
        {upcoming.title}
      {:else}
        TBD
      {/if}
    </h2>
  </article>

  {#if previous}
    <article>
      <p class="font-light">{m.landing_meetingPrev()}</p>
      <h2 class="text-xl font-light">
        {previous.title}
      </h2>
    </article>
  {/if}
</a>
