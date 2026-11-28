<script lang="ts">
  import * as Popover from "$lib/components/ui/popover";
  import { Label } from "$lib/components/ui/label/index.js";
  import DatePicker from "$lib/components/datetime-selector/DatePicker.svelte";
  import TypstEditor from "$lib/actic/editor/TypstEditor.svelte";
  import ToolbarButton from "$lib/actic/editor/ToolbarButton.svelte";
  import Languages from "@lucide/svelte/icons/languages";
  import Calendar from "@lucide/svelte/icons/calendar";
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

  // The language and date popovers are separate roots; opening one closes
  // the other. Each `open` is bound so the trigger's toggle can write back.
  let langOpen = $state(false);
  let dateOpen = $state(false);
</script>

<div class="flex flex-col gap-1.5">
  <Label for="body">{label}</Label>
  {#snippet documentSettings()}
    <div class="flex items-center gap-1">
      <Popover.Root
        bind:open={langOpen}
        onOpenChange={(open) => {
          if (open) dateOpen = false;
        }}
      >
        <Popover.Trigger>
          {#snippet child({ props })}
            <ToolbarButton {...props} label={m.actic_settings_lang()}>
              <Languages class="size-4" />
            </ToolbarButton>
          {/snippet}
        </Popover.Trigger>
        <Popover.Content align="end" class="flex w-80 flex-col gap-4">
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

      <Popover.Root
        bind:open={dateOpen}
        onOpenChange={(open) => {
          if (open) langOpen = false;
        }}
      >
        <Popover.Trigger>
          {#snippet child({ props })}
            <ToolbarButton {...props} label={m.actic_field_date()}>
              <Calendar class="size-4" />
            </ToolbarButton>
          {/snippet}
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
        </Popover.Content>
      </Popover.Root>
    </div>
  {/snippet}
  <TypstEditor
    id="body"
    bind:value={writer.body}
    pageActions={documentSettings}
    placeholder={bodyGhost ?? m.actic_body_placeholder()}
    {compact}
  />
</div>
