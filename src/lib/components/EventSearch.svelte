<script lang="ts">
  import EntitySearch from "$lib/components/EntitySearch.svelte";
  import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";
  import dayjs from "dayjs";
  let clazz = "";
  export { clazz as class };
  export let isSearching = false;
  export let onSelect:
    | ((event: ExtendedPrismaModel<"Event">) => void)
    | undefined;
  export let handleSearch: (searchValue: string) => void;

  const getOption = (option: unknown) => option as ExtendedPrismaModel<"Event">;
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
