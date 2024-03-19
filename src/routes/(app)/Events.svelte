<script lang="ts">
  import { markdownToTxt } from "markdown-to-txt";
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
          <div class="text-center text-6xl font-semibold">
            {event.startDatetime.getDay().toString().padStart(2, "0")}
          </div>
        </div>

        <div class="flex min-w-0 flex-col justify-between overflow-hidden">
          <!-- for screen readers, we icnlude this anchor -->
          <h2 class="line-clamp-1 text-xl font-bold leading-none">
            {event.title}
          </h2>
          <p class="line-clamp-3 text-ellipsis leading-snug">
            {markdownToTxt(event.description)}
          </p>
        </div>
      </a>
    </li>
  {/each}
</ol>
