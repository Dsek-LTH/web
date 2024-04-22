<script lang="ts">
  import { markdownToTxt } from "markdown-to-txt";
  import type { Event } from "@prisma/client";
  export let events: Array<
    Pick<Event, "slug" | "title" | "description" | "startDatetime">
  >;
</script>

<ol class="flex flex-col gap-4" role="article">
  {#each events as event}
    <li>
      <a
        href="/events/{event.slug}"
        class="flex gap-4 rounded-2xl bg-base-300 p-4 transition-all duration-200 hover:-translate-x-1 hover:-translate-y-1 hover:bg-base-200 hover:shadow-xl"
      >
        <div>
          <div
            class="rounded-t-lg bg-primary text-center text-sm font-bold capitalize text-black"
          >
            {event.startDatetime.toLocaleString("sv-SE", {
              weekday: "long",
            })}
          </div>
          <div
            class="rounded-b-lg bg-base-100 p-4 text-center text-6xl font-semibold"
          >
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
