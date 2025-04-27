<script lang="ts">
  import EntitySearch from "$lib/components/EntitySearch.svelte";
  import type { Event } from "@prisma/client";
  import dayjs from "dayjs";

  interface Props {
    class?: string;
    isSearching?: boolean;
    onSelect: ((event: Event) => void) | undefined;
    handleSearch: (searchValue: string) => void;
    children?: import("svelte").Snippet;
    [key: string]: any;
  }

  let {
    class: clazz = "",
    isSearching = $bindable(false),
    onSelect = $bindable(),
    handleSearch = $bindable(),
    children,
    ...rest
  }: Props = $props();

  const getOption = (option: unknown) => option as Event;
</script>

<EntitySearch
  endpoint="/api/events"
  class={clazz}
  bind:isSearching
  bind:onSelect
  bind:handleSearch
  {...rest}
>
  {@render children?.()}
  {#snippet entity({ option })}
    <div>
      {@const event = getOption(option)}
      {event.title} ({dayjs(event.startDatetime).format("DD MM YYYY")}, {event.slug ??
        event.id})
    </div>
  {/snippet}
</EntitySearch>
