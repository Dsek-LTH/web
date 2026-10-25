<script lang="ts">
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import DatePicker from "$lib/components/datetime-selector/DatePicker.svelte";
  import { FIELD_BG } from "$lib/actic/fieldStyles";
  import type { MandateValue } from "$lib/actic/dsek";
  import * as m from "$paraglide/messages";

  let { value = $bindable() }: { value?: MandateValue } = $props();

  const currentYear = new Date().getFullYear();

  function setMode(mode: "year" | "custom") {
    if (value?.mode === mode) return;
    value =
      mode === "year"
        ? { mode: "year", year: currentYear }
        : {
            mode: "custom",
            fromIso: `${currentYear}-01-01`,
            toIso: `${currentYear}-12-31`,
          };
  }
</script>

<div class="flex flex-col gap-1.5">
  <Label>{m.actic_field_mandate()}</Label>
  <div class="flex flex-wrap items-center gap-3">
    <div class="border-border flex overflow-hidden rounded-md border">
      <button
        type="button"
        class="px-3 py-1.5 text-sm whitespace-nowrap"
        class:bg-primary={value?.mode === "year"}
        class:text-primary-foreground={value?.mode === "year"}
        onclick={() => setMode("year")}
      >
        {m.actic_mandate_year()}
      </button>
      <button
        type="button"
        class="px-3 py-1.5 text-sm whitespace-nowrap"
        class:bg-primary={value?.mode === "custom"}
        class:text-primary-foreground={value?.mode === "custom"}
        onclick={() => setMode("custom")}
      >
        {m.actic_mandate_custom()}
      </button>
    </div>

    {#if value?.mode === "year"}
      <label class="flex items-center gap-2 text-sm">
        <span class="text-muted-foreground">{m.actic_mandate_year_label()}</span
        >
        <Input type="number" class="{FIELD_BG} w-24" bind:value={value.year} />
      </label>
    {:else if value?.mode === "custom"}
      <div class="flex items-center gap-2">
        <span class="text-muted-foreground text-sm"
          >{m.actic_mandate_from()}</span
        >
        <DatePicker bind:value={value.fromIso} iso class="h-9" />
        <span class="text-muted-foreground text-sm">{m.actic_mandate_to()}</span
        >
        <DatePicker bind:value={value.toIso} iso class="h-9" />
      </div>
    {/if}
  </div>
</div>
