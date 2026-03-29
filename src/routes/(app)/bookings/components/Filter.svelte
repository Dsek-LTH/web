<script lang="ts">
  import * as Select from "$lib/components/ui/select";
  import { ListFilter } from "@lucide/svelte";
  import type { CalendarEventExternal } from "@schedule-x/calendar";

  let {
    currentCategory = $bindable(),
    defaultCategory,
    bookings,
  }: {
    currentCategory: string;
    defaultCategory: { value: string; label: string };
    bookings: CalendarEventExternal[];
  } = $props();

  // TODO: Load categories from db. Or maybe you only want to be able to filter by categories with at least one booking?
  const categories = $derived(
    [defaultCategory].concat(
      Array.from(
        new Set(bookings.map((booking) => booking.location).filter(Boolean)),
      ).map((location) => ({
        value: location!,
        label: location!,
      })),
    ),
  );

  const categoryTriggerContent = $derived(
    categories.find((category) => category.value === currentCategory)?.label ??
      defaultCategory.label,
  );
</script>

<!-- TODO: Add translations -->
<div
  class="not-sx-calendar:flex-col sx-calendar:items-center sx-calendar:gap-4 not-sx-calendar:mt-1 flex gap-2"
>
  <span
    class="text-muted-foreground sx-calendar:tracking-wide text-xs font-semibold tracking-widest uppercase"
  >
    Filter by:
  </span>

  {#snippet selectItem(item: { value: string; label: string })}
    <Select.Item
      class="data-[selected]:text-primary data-[highlighted]:text-primary"
      value={item.value}
    >
      {item.label}
    </Select.Item>
  {/snippet}

  <Select.Root type="single" bind:value={currentCategory}>
    <Select.Trigger class="sx-calendar:w-fit !h-fit w-full">
      <div class="flex w-full items-center justify-center">
        <ListFilter class="text-primary size-4 self-center" />
        <div
          class="font-base text-foreground flex w-full justify-center gap-2 py-1.5 pr-1 pl-3 text-sm leading-none font-medium tracking-wide uppercase"
        >
          Category:
          <span class="text-primary mt-0">{categoryTriggerContent}</span>
        </div>
      </div>
    </Select.Trigger>

    <Select.Content class="text-muted-foreground uppercase">
      {#each categories as category (category.value)}
        {@render selectItem(category)}
      {/each}
    </Select.Content>
  </Select.Root>
</div>
