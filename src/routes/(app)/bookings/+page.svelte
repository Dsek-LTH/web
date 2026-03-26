<script lang="ts">
  import BookingsCalendar from "./calendar/BookingsCalendar.svelte";
  import * as Select from "$lib/components/ui/select";
  import * as Item from "$lib/components/ui/item";
  import { BellRing, Info, KeyRound, ListFilter } from "@lucide/svelte";
  import type { Component } from "svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import { mode, setMode } from "mode-watcher";

  const defaultCategory = { value: "all", label: "all categories" };
  const categories = [
    defaultCategory,
    { value: "styrelserummet", label: "styrelserummet" },
    { value: "bil", label: "sektionsbilen" },
  ];

  let currentCategory = $state(defaultCategory.value);

  const categoryTriggerContent = $derived(
    categories.find((category) => category.value === currentCategory)?.label ??
      defaultCategory,
  );
</script>

<!-- TODO: Remove -->
<Button
  class="sx-calendar:block hidden"
  onclick={() => setMode(mode.current === "dark" ? "light" : "dark")}
  >SWITCH MODE/THEME</Button
>

<!-- TODO: Read actual data -->
<div
  class="sx-calendar:gap-6 sx-calendar:mt-10 mx-auto mt-6 mb-6 flex w-[var(--sx-calendar-width)] max-w-[var(--sx-calendar-max-width)] flex-col gap-5"
>
  <!-- HEADER -->
  <div class="flex w-full items-center justify-between">
    <div class="sx-calendar:gap-3 flex flex-col gap-2.5">
      <span
        class="text-foreground sx-calendar:text-6xl sx-calendar:-ml-1 sx-calendar:tracking-tighter -ml-0.5 text-5xl leading-none font-semibold tracking-tight uppercase"
      >
        Bookings
        <span class="text-primary italic">Dashboard</span>
      </span>
      <span
        class="text-muted-foreground sx-calendar:text-lg max-w-lg text-base leading-tight font-light"
      >
        Någon kort introducerande text om bokningar etc. etc. etc. etc. etc.
        etc. etc. etc. etc. etc. etc. etc. etc. etc. etc.
      </span>
    </div>

    <!-- STATUS BLOCKS - DESKTOP -->
    <div class="sx-calendar:flex hidden gap-3.5">
      {#snippet statusItem(
        title: string,
        titleColour: string,
        content: string,
        bodyColour?: string,
      )}
        <Item.Root class="w-40 px-6 py-4" variant="muted">
          <Item.Content>
            <Item.Title class={`${titleColour} text-xs leading-none uppercase`}
              >{title}</Item.Title
            >
            <Item.Description
              class={`text-4xl font-bold ${bodyColour ?? "text-foreground"}`}
              >{content}</Item.Description
            >
          </Item.Content>
        </Item.Root>
      {/snippet}
      {@render statusItem("accepted", "text-primary", "4")}
      {@render statusItem("pending", "text-lila-400", "2")}
      {@render statusItem(
        "rejected",
        "text-destructive",
        "0",
        "text-destructive",
      )}
    </div>
  </div>

  <!-- FILTER DROP-DOWN -->
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

  <!-- STATUS BLOCKS - MOBILE -->
  <div class="sx-calendar:hidden flex justify-between gap-3">
    {#snippet statusItem(
      title: string,
      titleColour: string,
      content: string,
      bodyColour?: string,
    )}
      <Item.Root class="py-4" variant="muted">
        <Item.Content>
          <Item.Description
            class={`mx-auto text-3xl font-bold ${bodyColour ?? "text-foreground"}`}
            >{content}</Item.Description
          >
          <Item.Title
            class={`${titleColour} mx-auto mt-0.5 text-[0.7rem] leading-none tracking-wide uppercase`}
            >{title}</Item.Title
          >
        </Item.Content>
      </Item.Root>
    {/snippet}
    {@render statusItem("accepted", "text-primary", "4")}
    {@render statusItem("pending", "text-lila-400", "2")}
    {@render statusItem(
      "rejected",
      "text-destructive",
      "0",
      "text-destructive",
    )}
  </div>

  <!-- CALENDAR -->
  <BookingsCalendar />

  <!-- INFO BLOCKS -->
  {#snippet infoItem(
    IconComponent: Component,
    title: string,
    description: string,
  )}
    <Item.Root variant="muted">
      <div
        class="flex h-full flex-col items-start justify-start gap-6 px-2 py-1.5"
      >
        <Item.Media>
          <IconComponent class="text-primary size-6"></IconComponent>
        </Item.Media>
        <Item.Content class="mb-auto">
          <Item.Title class="text-base">{title}</Item.Title>
          <Item.Description class="line-clamp-none"
            >{description}</Item.Description
          >
        </Item.Content>
      </div>
    </Item.Root>
  {/snippet}
  <div class="not-sx-calendar:flex-col flex w-full justify-between gap-4">
    {@render infoItem(
      Info,
      "Viktig allmän info kanske?",
      "hjskjfh akfhjkas hfjkah fjkhakfh ksafk ha afdjhasf kajkfh has fkhaksjf hf kahs fkjhajs",
    )}
    {@render infoItem(
      KeyRound,
      "Info om nycklar?",
      "hjskjfh akfhjkas hfjkah fjkhakfh ksafk ha hakjfhkja fas jfhask fjkash fjkahf jkahf kjhakjf hakjf hajkfh kajhfs jkhfask",
    )}
    {@render infoItem(
      BellRing,
      "Info om svar på bokningar?",
      "hjskjfh akfhjkas hfjkah fjkhakfh ksafk ha afag fhag",
    )}
  </div>
</div>
