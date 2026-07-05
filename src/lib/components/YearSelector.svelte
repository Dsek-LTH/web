<script lang="ts">
  import { page } from "$app/state";
  import { goto } from "$app/navigation";
  import * as Select from "$lib/components/ui/select";
  import { cn } from "$lib/utils";

  let { class: klass }: { class?: string } = $props();

  let selectedYear = $derived(
    page.url.searchParams.get("year") ?? new Date().getFullYear().toString()
  );

  function handleYearChange(value: string) {
    const url = new URL(page.url);
    url.searchParams.set("year", value);
    goto(url.toString(), { keepFocus: true, noScroll: true, replaceState: true });
  }
</script>

<Select.Root type="single" value={selectedYear} onValueChange={handleYearChange}>
  <Select.Trigger class={cn("w-[120px]", klass)}>
    {selectedYear}
  </Select.Trigger>
  <Select.Content>
    <Select.ScrollUpButton />
    <Select.Group>
      {#each Array.from({ length: new Date().getFullYear() - 1982 + 1 }, (value, index) => 1982 + index).toReversed() as n (n)}
        <Select.Item value={n.toString()}>{n}</Select.Item>
      {/each}
    </Select.Group>
    <Select.ScrollDownButton />
  </Select.Content>
</Select.Root>
