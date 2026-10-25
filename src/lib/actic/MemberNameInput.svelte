<script lang="ts">
  import { Input } from "$lib/components/ui/input/index.js";
  import { FIELD_BG } from "$lib/actic/fieldStyles";
  import {
    Avatar,
    AvatarFallback,
    AvatarImage,
  } from "$lib/components/ui/avatar/index.js";
  import { getFileUrl } from "$lib/files/client";
  import { debounce } from "$lib/utils/debounce";

  let {
    value = $bindable(""),
    id,
    placeholder,
    invalid = false,
    errorMessage = "",
    unstyled = false,
    onblur,
    oninput,
    onenter,
    onescape,
  }: {
    value?: string;
    id?: string;
    placeholder?: string;
    invalid?: boolean;
    errorMessage?: string;
    /** Render without the boxed input look, for rows in a shared list box. */
    unstyled?: boolean;
    onblur?: () => void;
    /** Called after the value changed, e.g. to grow a trailing free row. */
    oninput?: () => void;
    /** Fired on Enter when it was *not* used to complete a suggestion. */
    onenter?: () => void;
    /** Fired on Escape (the dropdown is closed at the same time). */
    onescape?: () => void;
  } = $props();

  type Member = {
    firstName?: string;
    lastName?: string;
    nickname?: string;
    studentId?: string;
    picturePath?: string | null;
  };

  let results = $state<Member[]>([]);
  let open = $state(false);
  /** Highlighted suggestion while navigating with the keyboard; -1 is none. */
  let activeIndex = $state(-1);
  const uid = $props.id();

  const search = debounce(async (query: string) => {
    if (!query) {
      results = [];
      open = false;
      return;
    }
    const url = new URL("/api/members", window.location.origin);
    url.searchParams.set("search", query);
    try {
      const response = await fetch(url);
      results = response.ok ? (await response.json()).slice(0, 6) : [];
    } catch {
      results = [];
    }
    activeIndex = -1;
    open = results.length > 0;
  }, 200);

  function displayName(member: Member): string {
    return (
      [member.firstName, member.lastName].filter(Boolean).join(" ") ||
      member.nickname ||
      ""
    );
  }

  function initials(member: Member): string {
    return (
      `${member.firstName?.[0] ?? ""}${member.lastName?.[0] ?? ""}`.toUpperCase() ||
      "?"
    );
  }

  function pick(member: Member) {
    value = displayName(member);
    results = [];
    activeIndex = -1;
    open = false;
    // A pick changes the value without an input event; let the parent react
    // (e.g. grow a new free row when the last row was filled).
    oninput?.();
  }

  function onkeydown(event: KeyboardEvent) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (!open || results.length === 0) return;
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      activeIndex = (activeIndex + step + results.length) % results.length;
    } else if (event.key === "Enter") {
      if (open && results.length > 0) {
        // Enter completes the highlighted (or first) suggestion instead of
        // adding a new row.
        event.preventDefault();
        pick(results[activeIndex] ?? (results[0] as Member));
      } else {
        onenter?.();
      }
    } else if (event.key === "Escape") {
      open = false;
      onescape?.();
    }
  }
</script>

<div class="relative">
  <Input
    {id}
    {placeholder}
    class={unstyled
      ? "rounded-none border-0 bg-transparent px-3 shadow-none focus-visible:border-transparent focus-visible:ring-0"
      : FIELD_BG}
    bind:value
    autocomplete="off"
    role="combobox"
    aria-expanded={open}
    aria-activedescendant={open && activeIndex >= 0 ? `${uid}-suggestion` : undefined}
    aria-invalid={invalid}
    aria-errormessage={errorMessage}
    onkeydown={onkeydown}
    oninput={() => {
      search(value);
      oninput?.();
    }}
    onfocus={() => {
      if (results.length) open = true;
    }}
    onblur={() => {
      setTimeout(() => (open = false), 150);
      onblur?.();
    }}
  />
  {#if open}
    <ul
      id={`${uid}-suggestions`}
      role="listbox"
      class="bg-popover border-border absolute inset-x-0 top-full z-50 mt-1 ml-0 w-full list-none overflow-hidden rounded-md border shadow-md"
    >
      {#each results as member, i (member.studentId)}
        <li role="presentation">
          <button
            type="button"
            id={`${uid}-suggestion`}
            role="option"
            aria-selected={activeIndex === i}
            class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm"
            class:bg-accent={activeIndex === i}
            onmousemove={() => (activeIndex = i)}
            onmousedown={(e) => {
              e.preventDefault();
              pick(member);
            }}
          >
            <Avatar class="size-6">
              <AvatarImage src={getFileUrl(member.picturePath)} alt="" />
              <AvatarFallback class="text-[10px]"
                >{initials(member)}</AvatarFallback
              >
            </Avatar>
            {displayName(member)}
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>
