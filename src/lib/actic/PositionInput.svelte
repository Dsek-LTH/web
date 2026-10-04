<script lang="ts">
  import { Input } from "$lib/components/ui/input/index.js";
  import { ALL_POSITIONS } from "$lib/actic/positions";
  import { groupLogoUrls } from "$lib/actic/committeeLogos";
  import type { AuthorInput } from "$lib/actic/dsek";

  function hideImg(event: Event) {
    if (event.currentTarget instanceof HTMLImageElement) {
      event.currentTarget.style.display = "none";
    }
  }

  let {
    position = $bindable(),
    id,
    placeholder,
  }: {
    position?: AuthorInput["position"];
    id?: string;
    placeholder?: string;
  } = $props();

  let focused = $state(false);
  let open = $state(false);

  function positionText(pos: AuthorInput["position"]): string {
    if (!pos) return "";
    if (pos.kind === "text") return pos.value;
    return ALL_POSITIONS.find((p) => p.path === pos.path)?.label ?? pos.path;
  }

  let input = $state(positionText(position));

  // Reflect external changes (e.g. loading a draft) but never fight the caret
  // while the user is typing.
  $effect(() => {
    const text = positionText(position);
    if (!focused && text !== input) input = text;
  });

  let matches = $derived(
    input.trim()
      ? ALL_POSITIONS.filter((p) =>
          p.label.toLowerCase().includes(input.trim().toLowerCase()),
        ).slice(0, 8)
      : [],
  );

  function setFromText(value: string) {
    const trimmed = value.trim();
    if (!trimmed) {
      position = undefined;
      return;
    }
    const match = ALL_POSITIONS.find(
      (p) => p.label.toLowerCase() === trimmed.toLowerCase(),
    );
    position = match
      ? { kind: "key", path: match.path }
      : { kind: "text", value: trimmed };
  }

  function pick(label: string) {
    input = label;
    open = false;
    setFromText(label);
  }
</script>

<div class="relative">
  <Input
    {id}
    {placeholder}
    value={input}
    autocomplete="off"
    oninput={(e) => {
      input = e.currentTarget.value;
      setFromText(input);
      open = true;
    }}
    onfocus={() => {
      focused = true;
      open = true;
    }}
    onblur={() => {
      focused = false;
      setTimeout(() => (open = false), 150);
    }}
  />
  {#if open && matches.length > 0}
    <ul
      class="bg-popover border-border absolute z-50 mt-1 max-h-64 w-max max-w-[22rem] min-w-full overflow-x-hidden overflow-y-auto rounded-md border shadow-md"
    >
      {#each matches as match (match.path)}
        {@const urls = groupLogoUrls(
          match.path.slice(0, match.path.indexOf(".")),
        )}
        <li>
          <button
            type="button"
            class="hover:bg-accent flex w-full items-center gap-2 px-3 py-2 text-left text-sm"
            onmousedown={(e) => {
              e.preventDefault();
              pick(match.label);
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
            <span class="flex min-w-0 flex-col">
              <span class="break-words">{match.label}</span>
              <span class="text-muted-foreground text-xs break-words"
                >{match.group}</span
              >
            </span>
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>
