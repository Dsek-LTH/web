<script lang="ts">
  import { run } from "svelte/legacy";

  import { page } from "$app/state";

  type TabOption = {
    name: string;
    value: string;
  };
  interface Props {
    options?: TabOption[];
    fieldName?: string;
    currentTab?: any;
  }

  let {
    options = [],
    fieldName = "type",
    currentTab = $bindable(options[0]?.value),
  }: Props = $props();
  run(() => {
    (() => {
      const searchParamValue = page.url.searchParams.get(fieldName);
      if (searchParamValue) {
        currentTab = searchParamValue;
      }
    })();
  });

  let generateLink = $derived((value: string) => {
    const searchParams = new URLSearchParams(page.url.searchParams);
    searchParams.set(fieldName, value.toString());
    return `?${searchParams.toString()}`;
  });
</script>

<div
  role="tablist"
  class="tabs-boxed flex w-full flex-col items-stretch sm:w-auto sm:flex-row"
>
  {#each options as tabOption (tabOption.value)}
    <a
      href={generateLink(tabOption.value)}
      role="tab"
      class="tab h-auto"
      class:tab-active={tabOption.value === currentTab}
    >
      {tabOption.name}
    </a>
  {/each}
</div>
