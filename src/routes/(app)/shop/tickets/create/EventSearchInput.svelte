<script lang="ts">
  import EventSearch from "$lib/components/EventSearch.svelte";
  import Labeled from "$lib/components/Labeled.svelte";
  import type { Event } from "@prisma/client";
  import dayjs from "dayjs";
  import type { UnwrapEffects } from "sveltekit-superforms";
  import type { SuperForm } from "sveltekit-superforms/client";
  import type { CreateTicketSchema } from "./+page.server";
  let event: Event | undefined = undefined;
  let isSearching: boolean;
  let handleSearch: (search: string) => void;

  type Form = SuperForm<UnwrapEffects<CreateTicketSchema>>;
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
  <Labeled error={$errors.eventId} label="Event" id="event" class="w-full">
    <input
      type="hidden"
      name="eventId"
      value={$form.eventId}
      {...$constraints.eventId}
    />
    <div class="relative">
      <input
        id="event"
        autocomplete="off"
        autocapitalize="off"
        type="text"
        class="input input-bordered w-full {isSelected ? 'input-primary' : ''}"
        placeholder="Sök efter evenemang"
        tabIndex={0}
        value={event
          ? `${event.title} (${dayjs(event.startDatetime).format("YYYY")}, ${
              event.slug ?? event.id
            })`
          : ""}
        on:input={(e) => {
          event = undefined;
          handleSearch(e.currentTarget.value);
        }}
        {...$$restProps}
      />
      <span
        class="loading loading-spinner loading-md absolute right-2 top-1/2 -translate-y-1/2 text-primary transition-opacity opacity-{isSearching
          ? '100'
          : '0'}"
      />
    </div>
  </Labeled>
</EventSearch>
