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

<Button onclick={() => setMode(mode.current === "dark" ? "light" : "dark")}
  >SWITCH MODE/THEME</Button
>

<div
  class="mx-auto mt-10 mb-6 flex w-[var(--sx-calendar-width)] max-w-full flex-col gap-6"
>
  <div class="flex w-full items-center justify-between">
    <div class="flex flex-col gap-3">
      <span
        class="text-foreground -ml-1 text-6xl leading-none font-semibold tracking-tighter uppercase"
      >
        Bookings
        <span class="text-primary italic">Dashboard</span>
      </span>
      <span class="text-muted-foreground max-w-lg text-lg font-light">
        Någon kort introducerande text om bokningar etc. etc. etc. etc. etc.
        etc. etc. etc. etc. etc. etc. etc. etc. etc. etc.
      </span>
    </div>
    <div class="flex gap-3.5">
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
  <div class="flex items-center gap-4">
    <span
      class="text-muted-foreground text-xs font-semibold tracking-wide uppercase"
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
      <Select.Trigger class="!h-fit w-fit">
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

  <BookingsCalendar />

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
  <div class="flex w-full justify-between gap-4">
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
