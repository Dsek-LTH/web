<script lang="ts">
  import { marked } from "marked";

  import type { Event } from "@prisma/client";
  export let events: Array<
    Pick<Event, "slug" | "title" | "description" | "startDatetime">
  >;
</script>

<ol class="contents" role="article">
  {#each events as event}
    <li>
      <a href="/events/{event.slug}" class="flex align-top">
        <div class="mr-5 h-24 w-24 min-w-24 bg-base-300">
          <div
            class="flex h-5 items-center justify-center bg-primary text-sm font-bold capitalize text-black"
          >
            {event.startDatetime.toLocaleString("sv-SE", {
              weekday: "long",
            })}
          </div>
          <p class="text-center text-6xl font-semibold">
            {event.startDatetime.getDay().toString().padStart(2, "0")}
          </p>
        </div>

        <div class="min-w-0">
          <h2 class="mb-4 text-xl font-bold leading-none">
            {event.title}
          </h2>
          <p class="line-clamp-3 break-words">
            <!-- eslint-disable-next-line svelte/no-at-html-tags - Sanitized server-side -->
            {@html marked(event.description)}
          </p>
        </div>
      </a>
    </li>
  {/each}
</ol>
