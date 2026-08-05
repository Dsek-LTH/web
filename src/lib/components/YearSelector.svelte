<script lang="ts">
  import { afterNavigate } from "$app/navigation";
  import { page } from "$app/state";
  import * as Tabs from "$lib/components/ui/tabs";
  import { cn } from "$lib/utils";
  import { SvelteURLSearchParams } from "svelte/reactivity";

  let {
    class: klass,
    max = new Date().getFullYear(),
    min = 1982,
  }: { class?: string; max?: number; min?: number } = $props();

  const generateLink = $derived((value: string) => {
    const searchParams = new SvelteURLSearchParams(page.url.searchParams);
    searchParams.set("year", value.toString());
    return `?${searchParams.toString()}`;
  });

  let tabBox: HTMLElement | null = $state(null);
  let tabList: HTMLElement | null = $state(null);
  let active: Element | undefined | null = $derived(null);

  $effect(() => {
    active =
      tabList?.children[
        new Date().getFullYear() -
          Number.parseInt(page.url.searchParams.get("year") ?? "2026")
      ];
  });

  function scrollToActive() {
    if (tabBox && active) {
      const activeRect = active.getBoundingClientRect();
      const tabsRect = tabBox.getBoundingClientRect();
      tabBox.scrollLeft =
        activeRect.left -
        tabsRect.left +
        tabBox.scrollLeft -
        (tabsRect.width - activeRect.width) / 2;
    }
  }
  afterNavigate(scrollToActive);
</script>

<Tabs.Root
  bind:ref={tabBox}
  class={cn(klass, "border-box overflow-y-scroll")}
  value={page.url.searchParams.get("year") ?? "2026"}
>
  <Tabs.List bind:ref={tabList}>
    {#each Array.from({ length: max - min + 1 }, (value, index) => min + index).toReversed() as n (n)}
      <a href={generateLink(n + "")}>
        <!-- eslint-disable-next-line @typescript-eslint/no-this-alias -->
        <Tabs.Trigger value={"" + n}>{n}</Tabs.Trigger></a
      >
    {/each}
  </Tabs.List>
</Tabs.Root>
