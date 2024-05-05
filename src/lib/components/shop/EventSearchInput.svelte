<script lang="ts">
  import EventSearch from "$lib/components/EventSearch.svelte";
  import Labeled from "$lib/components/Labeled.svelte";
  import type { Event } from "@prisma/client";
  import dayjs from "dayjs";
  import type { UnwrapEffects } from "sveltekit-superforms";
  import type { SuperForm } from "sveltekit-superforms/client";
  import type { TicketSchema } from "$lib/components/shop/types";
  export let event: Event | undefined = undefined;
  let isSearching: boolean;
  let handleSearch: (search: string) => void;

  type Form = SuperForm<UnwrapEffects<TicketSchema>>;
  export let form: Form["form"];
  export let constraints: Form["constraints"];
  export let errors: Form["errors"];

  const updateForm = (event: Event | undefined) => {
    if (!event) {
      $form.eventId = "";
      return;
    }
    $form.eventId = event.id;
  };
  $: updateForm(event);

  $: isSelected = !!event;
</script>

<EventSearch
  bind:handleSearch
  bind:isSearching
  onSelect={(selected) => {
    event = selected;
  }}
>
  <Labeled error={$errors.eventId} label="Event">
    <input
      type="hidden"
      name="eventId"
      value={$form.eventId}
      {...$constraints.eventId}
    />
    <div
      class="input input-bordered flex items-center gap-2 {isSelected
        ? 'input-primary'
        : ''}"
    >
      <span class="i-mdi-search text-xl" />
      <input
        id="event"
        autocomplete="off"
        autocapitalize="off"
        type="text"
        class="grow bg-transparent"
        placeholder="Sök efter evenemang"
        value={event
          ? `${event.title} (${dayjs(event.startDatetime).format("YYYY")}, ${
              event.slug ?? event.id
            })`
          : ""}
        on:input={(e) => {
          event = undefined;
          handleSearch(e.currentTarget.value);
        }}
        required
        {...$$restProps}
      />
      <span
        class="loading loading-spinner loading-md text-primary transition-opacity opacity-{isSearching
          ? '100'
          : '0'}"
      />
    </div>
  </Labeled>
</EventSearch>
