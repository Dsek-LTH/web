<script lang="ts">
  import * as Popover from "$lib/components/ui/popover";
  import { Label } from "$lib/components/ui/label/index.js";
  import DatePicker from "$lib/components/datetime-selector/DatePicker.svelte";
  import TypstEditor from "$lib/actic/editor/TypstEditor.svelte";
  import Hint from "$lib/actic/editor/Hint.svelte";
  import Settings from "@lucide/svelte/icons/settings";
  import * as m from "$paraglide/messages";
  import { bodyGhosts, randomGhost } from "$lib/actic/write/ghost-texts.svelte";
  import { todayIso, type Writer } from "./writer.svelte";

  let {
    writer,
    label = m.actic_field_body(),
    compact = false,
  }: {
    writer: Writer;
    label?: string;
    /** Half the default body height, so following boxes fit on screen. */
    compact?: boolean;
  } = $props();

  // The body's ghost text varies per visit; the language setting picks the
  // pool (and re-rolls it). The family is read as a STRING derived — the
  // input object itself is rebuilt on every keystroke, and depending on it
  // would re-roll the ghost while the user types.
  const family = $derived(writer.input.family);
  // eslint-disable-next-line svelte/prefer-writable-derived -- random ghost is client-only; $derived would also run during SSR
  let bodyGhost = $state<string>();
  $effect(() => {
    bodyGhost = randomGhost(bodyGhosts(family, writer.lang));
  });
</script>

<div class="flex flex-col gap-1.5">
  <Label for="body">{label}</Label>
  {#snippet documentSettings()}
    <Popover.Root>
      <Hint label={m.actic_settings()}>
        <Popover.Trigger
          class="hover:bg-accent hover:text-foreground flex h-[30px] items-center gap-1 rounded-[13px] px-[7px] text-sm"
          aria-label={m.actic_settings()}
        >
          <Settings class="h-4 w-4" />
        </Popover.Trigger>
      </Hint>
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
              class:bg-rosa-background={writer.lang === "sv"}
              class:text-rosa-foreground={writer.lang === "sv"}
              onclick={() => (writer.lang = "sv")}
            >
              Svenska
            </button>
            <button
              type="button"
              class="px-3 py-1.5 text-sm whitespace-nowrap"
              class:bg-rosa-background={writer.lang === "en"}
              class:text-rosa-foreground={writer.lang === "en"}
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
    placeholder={bodyGhost ?? m.actic_body_placeholder()}
    {compact}
  />
</div>
