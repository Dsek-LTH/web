<script lang="ts">
  import { tick } from "svelte";
  import { Input } from "$lib/components/ui/input/index.js";
  import { FIELD_BG } from "$lib/actic/fieldStyles";
  import { COMMITTEE_GROUPS } from "$lib/actic/positions";
  import { groupLogoUrls } from "$lib/actic/committeeLogos";
  import type { KeyedValue } from "$lib/actic/dsek";
  import { getLocale } from "$paraglide/runtime";

  function hideImg(event: Event) {
    if (event.currentTarget instanceof HTMLImageElement) {
      event.currentTarget.style.display = "none";
    }
  }

  let {
    value = $bindable(),
    id,
    placeholder,
  }: {
    value?: KeyedValue;
    id?: string;
    placeholder?: string;
  } = $props();

  const en = $derived(getLocale() === "en");
  let focused = $state(false);
  let open = $state(false);
  /** Highlighted option while navigating with the keyboard; -1 is none. */
  let activeIndex = $state(-1);
  let listEl: HTMLUListElement | undefined = $state();
  const uid = $props.id();

  function labelOf(group: (typeof COMMITTEE_GROUPS)[number]): string {
    return en ? group.labelEn : group.label;
  }

  function textOf(v: KeyedValue | undefined): string {
    if (!v) return "";
    if (v.kind === "text") return v.value;
    const group = COMMITTEE_GROUPS.find((g) => g.key === v.path);
    return group ? labelOf(group) : v.path;
  }

  let input = $state(textOf(value));

  // Reflect external changes (e.g. loading a draft) but never fight the caret
  // while the user is typing.
  $effect(() => {
    const text = textOf(value);
    if (!focused && text !== input) input = text;
  });

  let matches = $derived(
    input.trim()
      ? COMMITTEE_GROUPS.filter((g) =>
          labelOf(g).toLowerCase().includes(input.trim().toLowerCase()),
        ).slice(0, 8)
      : COMMITTEE_GROUPS,
  );

  function setFromText(text: string) {
    const trimmed = text.trim();
    if (!trimmed) {
      value = undefined;
      return;
    }
    const match = COMMITTEE_GROUPS.find(
      (g) => labelOf(g).toLowerCase() === trimmed.toLowerCase(),
    );
    value = match
      ? { kind: "key", path: match.key }
      : { kind: "text", value: trimmed };
  }

  function pick(group: (typeof COMMITTEE_GROUPS)[number]) {
    input = labelOf(group);
    open = false;
    value = { kind: "key", path: group.key };
  }

  // Keyboard navigation: focus stays on the input while the highlight moves
  // through the list (a combobox, not a menu of tab stops).
  async function scrollActive() {
    await tick();
    (listEl?.children[activeIndex] as HTMLElement | undefined)?.scrollIntoView({
      block: "nearest",
    });
  }

  function onkeydown(event: KeyboardEvent) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      open = true;
      const count = matches.length;
      if (count === 0) return;
      if (activeIndex === -1) {
        activeIndex = event.key === "ArrowDown" ? 0 : count - 1;
      } else {
        const step = event.key === "ArrowDown" ? 1 : -1;
        activeIndex = (activeIndex + step + count) % count;
      }
      scrollActive();
    } else if (event.key === "Enter" && open && activeIndex >= 0) {
      event.preventDefault();
      const group = matches[activeIndex];
      if (group) pick(group);
    } else if (event.key === "Escape" || event.key === "Tab") {
      open = false;
    }
  }
</script>

<div class="relative">
  <Input
    {id}
    {placeholder}
    class={FIELD_BG}
    value={input}
    autocomplete="off"
    role="combobox"
    aria-expanded={open}
    aria-controls={open ? `${uid}-listbox` : undefined}
    aria-activedescendant={open && activeIndex >= 0 ? `${uid}-${activeIndex}` : undefined}
    onkeydown={onkeydown}
    oninput={(e) => {
      input = e.currentTarget.value;
      setFromText(input);
      activeIndex = -1;
      open = true;
    }}
    onfocus={() => {
      focused = true;
      activeIndex = -1;
      open = true;
    }}
    onblur={() => {
      focused = false;
      setTimeout(() => (open = false), 150);
    }}
  />
  {#if open && matches.length > 0}
    <ul
      bind:this={listEl}
      id={`${uid}-listbox`}
      role="listbox"
      class="bg-popover border-border absolute inset-x-0 top-full z-50 mt-1 ml-0 max-h-64 list-none overflow-y-auto rounded-md border shadow-md"
    >
      {#each matches as group, i (group.key)}
        {@const urls = groupLogoUrls(group.key)}
        <li role="presentation">
          <button
            type="button"
            id={`${uid}-${i}`}
            role="option"
            aria-selected={activeIndex === i}
            class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm"
            class:bg-accent={activeIndex === i}
            onmousemove={() => (activeIndex = i)}
            onmousedown={(e) => {
              e.preventDefault();
              pick(group);
            }}
          >
            {#if urls}
              <img
                src={urls.light}
                alt=""
                class="h-5 w-5 shrink-0 object-contain dark:hidden"
                onerror={hideImg}
              />
              <img
                src={urls.dark}
                alt=""
                class="hidden h-5 w-5 shrink-0 object-contain dark:block"
                onerror={hideImg}
              />
            {/if}
            <span class="break-words">{labelOf(group)}</span>
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>
