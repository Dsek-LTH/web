<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import type { BookingCalendarEvent } from "$lib/bookings/eventTypes";
  import { getCategoryOptions } from "$lib/bookings/mappers";
  import { setCategoryFilter } from "$lib/bookings/filters";
  import * as Select from "$lib/components/ui/select";
  import * as m from "$paraglide/messages";
  import { ListFilter } from "@lucide/svelte";

  let {
    defaultCategory,
    currentCategoryValue,
    bookings,
  }: {
    defaultCategory: { value: string; label: string };
    currentCategoryValue: string;
    bookings: BookingCalendarEvent[];
  } = $props();

  const categories = $derived(getCategoryOptions(bookings, defaultCategory));

  const categoryTriggerContent = $derived(
    categories.find((category) => category.value === currentCategoryValue)
      ?.label ?? defaultCategory.label,
  );

  const setCategory = (category: string) => {
    const url = new URL(page.url);
    setCategoryFilter(url, category, defaultCategory.value);

    // eslint-disable-next-line svelte/no-navigation-without-resolve -- the url is correct
    goto(url, {
      replaceState: true,
      keepFocus: true,
      noScroll: true,
    });
  };
</script>

<div
  class="not-sx-calendar:flex-col sx-calendar:items-center sx-calendar:gap-4 not-sx-calendar:mt-1 flex gap-2"
>
  <span
    class="text-muted-foreground sx-calendar:tracking-wide text-xs font-semibold tracking-widest uppercase"
  >
    {m.booking_filterBy()}:
  </span>

  {#snippet selectItem(item: { value: string; label: string })}
    <Select.Item
      class="data-[selected]:text-primary data-[highlighted]:text-primary"
      value={item.value}
    >
      {item.label}
    </Select.Item>
  {/snippet}

  <Select.Root
    type="single"
    bind:value={currentCategoryValue}
    onValueChange={setCategory}
  >
    <Select.Trigger class="sx-calendar:w-fit !h-fit w-full">
      <div class="flex w-full items-center justify-center">
        <ListFilter class="text-primary size-4 self-center" />
        <div
          class="font-base text-foreground flex w-full justify-center gap-2 py-1.5 pr-1 pl-3 text-sm leading-none font-medium tracking-wide uppercase"
        >
          {m.booking_category()}:
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
