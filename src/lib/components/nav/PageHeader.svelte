<script lang="ts">
  import { page } from "$app/stores";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import { twMerge } from "tailwind-merge";

  export let title: string | undefined;
  let clazz = "";
  export { clazz as class };
</script>

<SetPageTitle {title} />

<!-- If it's an app, the page title is shown at the top, in the header -->
{#if !$page.data.isApp}
  <h1 class={twMerge("mb-4 text-2xl font-bold", clazz)}>
    {title}
    <slot name="after-title" />
  </h1>
{/if}
