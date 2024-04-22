<script lang="ts">
  import { enhance } from "$app/forms";
  import dayjs from "dayjs";
  import BuyButton from "$lib/components/BuyButton.svelte";

  export let data;
  $: ticket = data.ticket;
  $: event = ticket.event;

  let isSubmitting = false;
</script>

<div class="mx-auto md:container md:mt-8 md:grid md:grid-cols-2">
  <img
    src={event.imageUrl ??
      "https://minio.api.dsek.se/news/public/8c97c4c6-d4f4-44f5-9658-cff70110ad85.webp"}
    alt="{event.title} cover photo"
    class="aspect-video object-cover md:rounded-xl"
  />

  <main class="m-4 flex flex-col gap-4">
    <h1 class="text-xl font-bold">{ticket.title}</h1>
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

    {#if ticket.description}
      <p>{ticket.description}</p>
    {/if}

    <form
      class="mt-8"
      method="POST"
      action="/shop/tickets?/addToCart"
      use:enhance={() => {
        isSubmitting = true;
        return ({ update }) => {
          isSubmitting = false;
          update();
        };
      }}
    >
      <input type="hidden" name="ticketId" value={ticket.id} />
      <BuyButton {ticket} {isSubmitting} />
    </form>
  </main>
</div>
