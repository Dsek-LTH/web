<script lang="ts">
  import type { WikiDataItem } from "$lib/server/loadHomeData";
  import { PUBLIC_MEDIAWIKI_ENDPOINT } from "$env/static/public";
  import dayjs from "dayjs";

  let { items }: { items: WikiDataItem[] } = $props();

  let wikiUrl = $derived(new URL(PUBLIC_MEDIAWIKI_ENDPOINT).origin);
</script>

<div
  class="rounded-t-xl border-t-4 border-t-secondary bg-base-300 p-4 text-2xl font-bold"
>
  <a href={wikiUrl} class="hover:underline">Wiki</a>
</div>
<div
  class="grid grid-cols-1 flex-row divide-base-100 rounded-b-xl sm:grid-cols-2 sm:divide-x-2 md:grid-cols-3 sm:[&>*:first-child]:rounded-bl-xl [&>*:last-child]:rounded-br-xl max-sm:[&>*:nth-child(2)]:rounded-b-xl sm:max-md:[&>*:nth-child(2)]:rounded-br-xl max-md:[&>*:nth-child(3)]:hidden"
>
  {#each items as item (item.revid)}
    {@const date = new Date(item.timestamp)}
    <div class="pop-out mt-0.5 bg-base-200">
      <a
        href="{wikiUrl}/wiki/{item.title}"
        class="flex h-full overflow-hidden p-4"
      >
        <article class="flex flex-col justify-between">
          <section>
            <h2 class="mb-2 text-ellipsis text-xl font-bold text-secondary">
              {item.title}
            </h2>
            <p class="line-clamp-3 flex-none text-ellipsis leading-normal">
              {item.extract}
            </p>
          </section>
          <footer>
            <p
              class="my-1 self-end text-nowrap text-xs font-light text-neutral-600"
            >
              {item.user.toLowerCase()}
              {#if dayjs(date).diff(dayjs(), "week") < -1}
                {dayjs(date).format("YYYY-MM-DD")}
              {:else}
                {dayjs(date).fromNow()}
              {/if}
            </p>
          </footer>
        </article>
      </a>
    </div>
  {/each}
</div>
