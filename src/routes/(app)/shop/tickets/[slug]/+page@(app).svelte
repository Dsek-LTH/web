<script lang="ts">
  import { enhance } from "$app/forms";
  import { now } from "$lib/stores/date";
  import dayjs from "dayjs";

  export let data;
  $: ticket = data.ticket;
  $: event = ticket.event;
  $: shoppable = ticket.shoppable;

  $: isUpcoming = ticket.shoppable.availableFrom > $now;
  $: isPast = shoppable.availableTo && shoppable.availableTo < $now;
  $: isActive = !isUpcoming && !isPast;
</script>

<div class="mx-auto md:container md:mt-8 md:grid md:grid-cols-2">
  <img
    src={event.imageUrl ??
      "https://minio.api.dsek.se/news/public/8c97c4c6-d4f4-44f5-9658-cff70110ad85.webp"}
    alt="{event.title} cover photo"
    class="aspect-video object-cover md:rounded-xl"
  />

  <main class="m-4 flex flex-col gap-4">
    <h1 class="text-xl font-bold">{shoppable.title}</h1>
    <div
      class="flex flex-wrap items-center gap-2 text-sm text-base-content/60 *:flex *:items-center *:gap-1"
    >
      <p>
        <span class="i-mdi-calendar" />
        <a href="/events/{event.slug}" class="link-hover">
          {event.title}
        </a>
      </p>

      <p>
        <span class="i-mdi-clock" />{dayjs(event.startDatetime).format(
          "dddd Do MMM",
        )}
      </p>

      {#if event.location}
        <p>
          <span class="i-mdi-map-marker" />
          <a
            href="https://maps.google.com/?q={event.location}"
            target="_blank"
            rel="noreferrer noopener"
            class="link-hover"
          >
            {event.location}
          </a>
        </p>
      {/if}
    </div>

    <p>{shoppable.description}</p>

    <form method="POST" action="/shop/tickets?/addToCart" use:enhance>
      <input type="hidden" name="ticketId" value={ticket.id} />
      <button
        type="submit"
        class="btn btn-primary w-full"
        class:btn-disabled={!isActive}
      >
        {#if isUpcoming}
          Öppnar {dayjs(ticket.shoppable.availableFrom).fromNow()}
        {:else if isPast}
          Stängde {dayjs(ticket.shoppable.availableTo).fromNow()}
        {:else if isActive}
          Köp
        {:else}
          Stängd
        {/if}
      </button>
    </form>
  </main>
</div>
