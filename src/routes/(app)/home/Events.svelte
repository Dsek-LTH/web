<script lang="ts">
  import { markdownToTxt } from "markdown-to-txt";
  import type { Event } from "@prisma/client";
  import { languageTag } from "$paraglide/runtime";
  import * as m from "$paraglide/messages";
  export let events: Array<
    Pick<Event, "slug" | "title" | "description" | "startDatetime">
  >;
</script>

<div
  class="rounded-t-xl border-t-4 border-t-primary bg-base-300 p-4 text-2xl font-bold"
>
  {m.events()}
</div>
<div
  class="grid flex-row divide-x-2 divide-base-100 sm:grid-cols-2 md:grid-cols-3 sm:[&>*:first-child]:rounded-bl-xl [&>*:last-child]:rounded-br-xl max-sm:[&>*:nth-child(2)]:rounded-b-xl sm:max-md:[&>*:nth-child(2)]:rounded-br-xl max-md:[&>*:nth-child(3)]:hidden"
>
  {#each events as event}
    <div class="mt-0.5 bg-base-200">
      <a
        href="/events/{event.slug}"
        class="pop-out flex h-full flex-col justify-start gap-x-4 p-4"
      >
        <div class="flex flex-row">
          <div
            class="place-items-center rounded-l-lg bg-base-300 px-4 py-2 text-center text-2xl font-bold capitalize text-primary"
          >
            {event.startDatetime.toLocaleString(languageTag(), {
              weekday: "long",
            })}
          </div>
          <div
            class="flex flex-1 items-center justify-center rounded-r-lg bg-base-300/50 text-3xl font-semibold text-primary"
          >
            {event.startDatetime.toLocaleDateString("sv-SE", {
              day: "2-digit",
            }) +
              "/" +
              event.startDatetime.toLocaleDateString("sv-SE", {
                month: "2-digit",
              })}
          </div>
        </div>

        <div class="p-2">
          <h2 class="line-clamp-1 text-xl font-bold leading-snug text-primary">
            {event.title}
          </h2>
          <p class="line-clamp-3 text-ellipsis break-all leading-snug">
            {markdownToTxt(event.description, { pedantic: true })}
          </p>
        </div>
      </a>
    </div>
  {/each}
</div>
