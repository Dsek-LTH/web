<script lang="ts">
  import { page } from "$app/stores";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import { twMerge } from "tailwind-merge";

  interface Props {
    title: string | undefined;
    class?: string;
  }

  let { title, class: clazz = "" }: Props = $props();
</script>

<SetPageTitle {title} />

<!-- If it's an app, the page title is shown at the top instead, in the header -->
{#if !$page.data.isApp}
  <!-- page-title is to be styled in css -->
  <h1 class={twMerge("page-title mb-4 text-2xl font-bold", clazz)}>
    {title}
  </h1>
{/if}
