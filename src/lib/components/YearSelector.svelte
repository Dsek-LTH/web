<script lang="ts">
  import { page } from "$app/state";
  import { SvelteURLSearchParams } from "svelte/reactivity";
  import { goto } from "$app/navigation";
  import * as Select from "$lib/components/ui/select";
  import { Button } from "$lib/components/ui/button";
  import { cn } from "$lib/utils";
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";
  import ChevronRight from "@lucide/svelte/icons/chevron-right";

  let { class: klass }: { class?: string } = $props();

  const currentYear = new Date().getFullYear();
  const minYear = 1982;

  const years = Array.from(
    { length: currentYear - minYear + 1 },
    (_, i) => currentYear - i,
  );

  function parseYear(param: string | null) {
    const year = Number(param);
    const valid =
      Number.isInteger(year) && year >= minYear && year <= currentYear;
    return valid ? year : currentYear;
  }

  let selectedYearNum: number = $derived(
    parseYear(page.url.searchParams.get("year")),
  );
  let selectedYearStr: string = $derived(String(selectedYearNum));

  function handleYearChange(value: string) {
    const searchParams = new SvelteURLSearchParams(page.url.searchParams);
    searchParams.set("year", value);
    // eslint-disable-next-line svelte/no-navigation-without-resolve -- Navigation uses relative search params
    goto(`?${searchParams.toString()}`, {
      keepFocus: true,
      noScroll: true,
      replaceState: true,
    });
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
    disabled={selectedYearNum <= minYear}
    onclick={decrementYear}
    class="size-9 shrink-0"
  >
    <!-- size-9 is same height as Select.Trigger with size="default" -->
    <ChevronLeft class="size-4" />
  </Button>

  <Select.Root
    type="single"
    value={selectedYearStr}
    onValueChange={handleYearChange}
  >
    <Select.Trigger class="w-[120px]" size="default">
      {selectedYearStr}
    </Select.Trigger>
    <Select.Content class="max-h-[300px]">
      <Select.ScrollUpButton />
      <Select.Group>
        {#each years as n (n)}
          <Select.Item value={n.toString()}>{n}</Select.Item>
        {/each}
      </Select.Group>
      <Select.ScrollDownButton />
    </Select.Content>
  </Select.Root>

  <Button
    variant="outline"
    size="icon"
    class="size-9 shrink-0"
    disabled={selectedYearNum >= currentYear}
    onclick={incrementYear}
  >
    <ChevronRight class="size-4" />
  </Button>
</div>
