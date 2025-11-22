<script lang="ts">
  import * as Button from "$lib/components/ui/button/index.js";
  import ArrowRight from "@lucide/svelte/icons/arrow-right";
  import ArrowLeft from "@lucide/svelte/icons/arrow-left";

  let {
    items = $bindable(),
  }: { items: { checked: boolean; title: string }[] } = $props();

  const selected = $derived(items.filter((i) => i.checked));
  const unSelected = $derived(items.filter((i) => !i.checked));
</script>

<div
  class="bg-muted-background flex w-full flex-row rounded-2xl border-[1px] p-4"
>
  <div class="w-1/2">
    <div class="pb-3 font-bold">Enabled</div>
    <div class="flex h-64 w-full flex-col gap-2 overflow-scroll px-4">
      {#each selected as selectedItem, i (`selected-${i}`)}
        <div class="flex flex-row items-center justify-between gap-2">
          {selectedItem.title}
          <Button.Root
            onclick={(e) => {
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
  <div class="w-1/2">
    <div class="pb-3 text-end font-bold">Disabled</div>
    <div class="flex h-64 w-full flex-col gap-2 overflow-scroll px-4">
      {#each unSelected as unSelectedItem, i (`unselected-${i}`)}
        <div class="flex flex-row items-center justify-between gap-2">
          <Button.Root
            onclick={(e) => {
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
          {unSelectedItem.title}
        </div>
      {/each}
    </div>
  </div>
</div>
