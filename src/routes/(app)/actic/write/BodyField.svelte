<script lang="ts">
  import * as Popover from "$lib/components/ui/popover";
  import { Label } from "$lib/components/ui/label/index.js";
  import DatePicker from "$lib/components/datetime-selector/DatePicker.svelte";
  import TypstEditor from "$lib/actic/TypstEditor.svelte";
  import Settings from "@lucide/svelte/icons/settings";
  import * as m from "$paraglide/messages";
  import { todayIso, type Writer } from "./writer.svelte";

  let {
    writer,
    label = m.actic_field_body(),
  }: {
    writer: Writer;
    label?: string;
  } = $props();
</script>

<div class="flex flex-col gap-1.5">
  <Label for="body">{label}</Label>
  {#snippet documentSettings()}
    <Popover.Root>
      <Popover.Trigger
        class="hover:bg-accent hover:text-foreground flex h-8 items-center gap-1 rounded px-2 text-sm"
        aria-label={m.actic_settings()}
      >
        <Settings class="h-4 w-4" />
      </Popover.Trigger>
      <Popover.Content align="end" class="flex w-80 flex-col gap-4">
        <div class="flex flex-col gap-1.5">
          <Label>{m.actic_field_date()}</Label>
          <p class="text-muted-foreground text-xs">
            {m.actic_settings_date_description()}
          </p>
          <!-- Today | custom date, as one segmented control; the side in use
               is highlighted rosa, like the mandate switcher. -->
          <div
            class="border-border flex h-9 w-fit items-center overflow-hidden rounded-md border"
          >
            <button
              type="button"
              class="self-stretch px-3 py-1.5 text-sm whitespace-nowrap"
              class:bg-rosa-background={writer.isToday}
              class:text-rosa-foreground={writer.isToday}
              onclick={() => (writer.dateIso = todayIso())}
            >
              {m.actic_date_today()}
            </button>
            <DatePicker
              bind:value={writer.dateIso}
              iso
              class={`h-9 rounded-none border-0 border-l px-3 text-sm shadow-none ${!writer.isToday ? "bg-rosa-background text-rosa-foreground hover:bg-rosa-hover" : ""}`}
            />
          </div>
        </div>
        <div class="flex flex-col gap-1.5">
          <Label>{m.actic_settings_lang()}</Label>
          <p class="text-muted-foreground text-xs">
            {m.actic_settings_lang_description()}
          </p>
          <div
            class="border-border flex w-fit overflow-hidden rounded-md border"
          >
            <button
              type="button"
              class="px-3 py-1.5 text-sm whitespace-nowrap"
              class:bg-primary={writer.lang === "sv"}
              class:text-primary-foreground={writer.lang === "sv"}
              onclick={() => (writer.lang = "sv")}
            >
              Svenska
            </button>
            <button
              type="button"
              class="px-3 py-1.5 text-sm whitespace-nowrap"
              class:bg-primary={writer.lang === "en"}
              class:text-primary-foreground={writer.lang === "en"}
              onclick={() => (writer.lang = "en")}
            >
              English
            </button>
          </div>
        </div>
      </Popover.Content>
    </Popover.Root>
  {/snippet}
  <TypstEditor
    id="body"
    bind:value={writer.body}
    trailing={documentSettings}
    placeholder={m.actic_body_placeholder()}
  />
</div>
