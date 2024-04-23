<script lang="ts">
  import { markdownToTxt } from "markdown-to-txt";
  import type { Event } from "@prisma/client";
  export let events: Array<
    Pick<Event, "slug" | "title" | "description" | "startDatetime">
  >;
</script>

<ol class="flex flex-col gap-4">
  {#each events as event}
    <li>
      <a
        href="/events/{event.slug}"
        class="pop-out grid grid-flow-col justify-start gap-4 rounded-2xl bg-base-300 p-4"
      >
        <div class="flex h-20 w-20 flex-col">
          <div
            class="rounded-t-lg bg-primary text-center font-bold capitalize text-black"
          >
            {event.startDatetime.toLocaleString("sv-SE", {
              weekday: "long",
            })}
          </div>
          <div
            class="flex flex-1 items-center justify-center rounded-b-lg bg-base-100 text-4xl font-semibold"
          >
            {event.startDatetime.getDate().toString().padStart(2, "0")}
          </div>
        </div>

        <div>
          <h2 class="line-clamp-1 text-xl font-bold leading-none">
            {event.title}
          </h2>
          <p class="line-clamp-3 text-ellipsis break-all leading-snug">
            {markdownToTxt(event.description)}
          </p>
        </div>
      </a>
    </li>
  {/each}
</ol>
