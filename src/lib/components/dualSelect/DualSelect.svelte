<script lang="ts">
  import * as Button from "$lib/components/ui/button/index.js";
  import ArrowRight from "@lucide/svelte/icons/arrow-right";
  import ArrowLeft from "@lucide/svelte/icons/arrow-left";
  import * as m from "$paraglide/messages";
  import Badge from "$lib/components/ui/badge/badge.svelte";

  let {
    items = $bindable(),
    name,
  }: {
    items: Array<{
      checked: boolean;
      title: string;
      value: string;
      color?: string | null;
    }>;
    name: string;
  } = $props();

  const selected = $derived(items.filter((i) => i.checked));
  const unSelected = $derived(items.filter((i) => !i.checked));

  let selectedValues: string[] = $state([]);

  // Sync selectedValues with items
  $effect(() => {
    selectedValues = items.filter((i) => i.checked).map((i) => i.value);
  });
</script>

<div
  class="bg-muted-background flex min-h-full w-full flex-row rounded-2xl border-[1px] p-4"
>
  <!-- Single hidden input containing JSON array -->
  <input type="hidden" {name} value={JSON.stringify(selectedValues)} />

  <div class="flex w-1/2 flex-col">
    <div class="pb-3 font-bold">{m.dualselect_enabled()}</div>
    <div class="flex w-full flex-1 flex-col gap-2 overflow-scroll px-4">
      {#each selected as selectedItem, i (`selected-${i}`)}
        <div class="flex flex-row items-center justify-between gap-2">
          <Badge color={selectedItem.color ?? undefined}>
            {selectedItem.title}
          </Badge>
          <Button.Root
            onclick={(_) => {
              items = items.map((item) =>
                item.title === selectedItem.title
                  ? { ...item, checked: false }
                  : item,
              );
            }}
            variant="outline"
            size="icon-sm"
          >
            <ArrowRight />
          </Button.Root>
        </div>
      {/each}
    </div>
  </div>
  <div class="border-r-[1px]"></div>
  <div class="flex w-1/2 flex-col">
    <div class="pb-3 text-end font-bold">{m.dualselect_disabled()}</div>
    <div class="flex w-full flex-1 flex-col gap-2 overflow-scroll px-4">
      {#each unSelected as unSelectedItem, i (`unselected-${i}`)}
        <div class="flex flex-row items-center justify-between gap-2">
          <Button.Root
            onclick={(_) => {
              items = items.map((item) =>
                item.title === unSelectedItem.title
                  ? { ...item, checked: true }
                  : item,
              );
            }}
            variant="outline"
            size="icon-sm"
          >
            <ArrowLeft />
          </Button.Root>

          <Badge color={unSelectedItem.color ?? undefined}>
            {unSelectedItem.title}
          </Badge>
        </div>
      {/each}
    </div>
  </div>
</div>
