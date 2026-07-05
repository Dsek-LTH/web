<script lang="ts">
  import { page } from "$app/state";
  import { goto } from "$app/navigation";
  import * as Select from "$lib/components/ui/select";
  import { Button } from "$lib/components/ui/button";
  import { cn } from "$lib/utils";
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";
  import ChevronRight from "@lucide/svelte/icons/chevron-right";

  let { class: klass }: { class?: string } = $props();

  const currentYear = new Date().getFullYear();
  const minYear = 1982;

  let selectedYearStr = $derived(
    page.url.searchParams.get("year") ?? currentYear.toString()
  );

  let selectedYearNum = $derived(parseInt(selectedYearStr, 10));

  function handleYearChange(value: string) {
    const url = new URL(page.url);
    url.searchParams.set("year", value);
    goto(url.toString(), { keepFocus: true, noScroll: true, replaceState: true });
  }

  function decrementYear() {
    if (selectedYearNum > minYear) {
      handleYearChange((selectedYearNum - 1).toString());
    }
  }

  function incrementYear() {
    if (selectedYearNum < currentYear) {
      handleYearChange((selectedYearNum + 1).toString());
    }
  }
</script>

<div class={cn("flex items-center gap-1", klass)}>
  <Button
    variant="outline"
    size="icon"
    class="h-10 w-10 shrink-0"
    disabled={selectedYearNum <= minYear}
    onclick={decrementYear}
  >
    <ChevronLeft class="size-4" />
  </Button>

  <Select.Root type="single" value={selectedYearStr} onValueChange={handleYearChange}>
    <Select.Trigger class="h-10 w-[120px]">
      {selectedYearStr}
    </Select.Trigger>
    <Select.Content class="max-h-[300px]">
      <Select.ScrollUpButton />
      <Select.Group>
        {#each Array.from({ length: currentYear - minYear + 1 }, (_, index) => minYear + index).toReversed() as n (n)}
          <Select.Item value={n.toString()}>{n}</Select.Item>
        {/each}
      </Select.Group>
      <Select.ScrollDownButton />
    </Select.Content>
  </Select.Root>

  <Button
    variant="outline"
    size="icon"
    class="h-10 w-10 shrink-0"
    disabled={selectedYearNum >= currentYear}
    onclick={incrementYear}
  >
    <ChevronRight class="size-4" />
  </Button>
</div>
