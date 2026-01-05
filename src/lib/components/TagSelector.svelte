<script lang="ts">
  import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";
  import { cn } from "$lib/utils";
  import TagChip from "./TagChip.svelte";
  import { Input } from "./ui/input";
  import type { SvelteComponent } from "svelte";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu";

  import Tags from "@lucide/svelte/icons/tags";
  import type { Props as InputProps } from "$lib/components/ui/input/input.svelte";
  import CircleAlert from "@lucide/svelte/icons/circle-alert";

  let {
    onChange = () => (searchValue = ""),
    name = undefined,
    allTags = [],
    selectedTags = $bindable([]),
    ...restProps
  }: {
    onChange?: () => void;
    name?: string | undefined;
    allTags?: Array<ExtendedPrismaModel<"Tag">>;
    selectedTags?: Array<
      Pick<ExtendedPrismaModel<"Tag">, "id"> &
        Partial<Omit<ExtendedPrismaModel<"Tag">, "id">>
    >;
  } & InputProps = $props();

  const internalOnChange: () => void = () => {
    onChange();
    searchValue = "";
    autocompleteEl?.["focus"]();
  };

  let searchValue = $state("");
  let filteredTags = $derived(
    allTags.filter(
      (tag) =>
        tag.name.toLowerCase().includes(searchValue.toLowerCase()) &&
        !selectedTags.map((tag) => tag.id).includes(tag.id),
    ),
  );

  let autocompleteEl: SvelteComponent;
  let inputRef: HTMLInputElement | null = $state(null);
</script>

<div class="flex flex-col gap-1">
  <DropdownMenu.Root onOpenChangeComplete={() => inputRef?.focus()}>
    <div class="relative flex w-full flex-row">
      <DropdownMenu.Trigger class="w-full">
        <div
          class={cn(
            "flex overflow-x-scroll overflow-y-hidden",
            "selection:bg-primary dark:bg-input/30 selection:text-primary-foreground border-input ring-offset-background placeholder:text-muted-foreground flex h-9 w-full min-w-0 rounded-md border bg-transparent text-sm font-medium shadow-xs transition-[color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-50",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            "aria-invalid:border-rosa-500 dark:aria-invalid:bg-rosa-950 aria-invalid:bg-rosa-50 aria-invalid:text-rosa-500 dark:aria-invalid:text-rosa-500 aria-invalid:border-[1px]",
          )}
          tabindex={0}
          role="combobox"
          aria-controls="tags-panel"
          aria-expanded="false"
          aria-invalid={restProps["aria-invalid"] ? true : false}
        >
          <div class="flex w-full flex-row items-center gap-1">
            <Tags class="text-muted-foreground ml-3 size-4 shrink-0" />
            {#if selectedTags.length > 0}
              {#each selectedTags as tag (tag.id)}
                {@const originalTag = allTags.find((t) => t.id === tag.id)}
                <button
                  type="button"
                  onclick={() => {
                    selectedTags = selectedTags.filter((o) => o !== tag);
                    internalOnChange();
                  }}
                >
                  <TagChip
                    tag={originalTag}
                    class="after:ml-2 after:content-['x'] first:ml-2"
                  />
                </button>
              {/each}
            {/if}

            <Input
              {name}
              id={name ?? "autocomplete"}
              autocomplete="off"
              autocapitalize="off"
              class="w-full border-0 bg-transparent py-0 focus-visible:ring-0"
              bind:value={searchValue}
              bind:this={autocompleteEl}
              bind:ref={inputRef}
            />
          </div>
        </div>
      </DropdownMenu.Trigger>
      {#if selectedTags.length > 0}
        <button
          type="button"
          class="btn btn-xs hover:text-muted-foreground absolute top-[20%] right-2 z-45 transition-all"
          onclick={() => {
            selectedTags = [];
            internalOnChange();
          }}>Clear</button
        >
      {/if}
    </div>
    <DropdownMenu.Content side="bottom" align="start" avoidCollisions={false}>
      <DropdownMenu.Group>
        <ul
          tabindex={0}
          role="listbox"
          class="z-10 flex max-h-80 w-full flex-col flex-nowrap overflow-y-auto rounded-md shadow lg:max-w-[20rem]"
          id="tags-panel"
        >
          {#each filteredTags as tag (tag.id)}
            <li>
              <button
                type="button"
                class="m-2 {selectedTags.includes(tag)
                  ? 'bg-primary hover:bg-primary-content hover:text-primary'
                  : ''}"
                onclick={() => {
                  if (selectedTags.includes(tag)) {
                    selectedTags = selectedTags.filter((o) => o.id !== tag.id);
                  } else {
                    selectedTags = [...selectedTags, tag];
                  }
                  internalOnChange();
                }}
              >
                <TagChip {tag} />
              </button>
            </li>
          {/each}
          {#if filteredTags.length === 0}
            <li class="border-b-base-content/10 w-full border-b">
              <button type="button" disabled class="disabled">No tags</button>
            </li>
          {/if}
        </ul>
      </DropdownMenu.Group>
    </DropdownMenu.Content>
  </DropdownMenu.Root>
  {#if restProps["aria-errormessage"]}
    <p class="text-rosa-500 mt-1 text-xs font-semibold">
      <CircleAlert class="mb-[2px] inline h-[1rem] w-[1rem]" />
      {restProps["aria-errormessage"]}
    </p>
  {/if}
</div>
