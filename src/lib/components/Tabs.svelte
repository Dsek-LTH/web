<script lang="ts">
  import { page } from "$app/stores";

  type TabOption = {
    name: string;
    value: string;
  };
  export let options: TabOption[] = [];
  export let fieldName = "type";
  export let currentTab = options[0]?.value;
  $: (() => {
    const searchParamValue = $page.url.searchParams.get(fieldName);
    if (searchParamValue) {
      currentTab = searchParamValue;
    }
  })();

  $: generateLink = (value: string) => {
    const searchParams = new URLSearchParams($page.url.searchParams);
    searchParams.set(fieldName, value.toString());
    return `?${searchParams.toString()}`;
  };
</script>

<div class="tabs-boxed tabs">
  {#each options as tabOption (tabOption.value)}
    <a
      href={generateLink(tabOption.value)}
      class="tab {tabOption.value === currentTab ? 'tab-active' : ''}"
      >{tabOption.name}</a
    >
  {/each}
</div>
