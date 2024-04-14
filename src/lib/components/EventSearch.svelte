<script lang="ts">
  import EntitySearch from "$lib/components/EntitySearch.svelte";
  import type { Event } from "@prisma/client";
  import dayjs from "dayjs";
  let clazz = "";
  export { clazz as class };
  export let isSearching = false;
  export let onSelect: ((event: Event) => void) | undefined;
  export let handleSearch: (searchValue: string) => void;

  const getOption = (option: unknown) => option as Event;
</script>

<EntitySearch
  endpoint="/api/events"
  class={clazz}
  bind:isSearching
  bind:onSelect
  bind:handleSearch
  {...$$restProps}
>
  <slot />
  <div slot="entity" let:option>
    {@const event = getOption(option)}
    {event.title} ({dayjs(event.startDatetime).format("DD MM YYYY")}, {event.slug ??
      event.id})
  </div>
</EntitySearch>
