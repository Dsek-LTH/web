<script lang="ts">
  import { twMerge } from "tailwind-merge";

  export let title: string | undefined;
  let clazz: string = "";
  export { clazz as class };
</script>

<svelte:head>
  {#if title}
    <title>{title} | D-sektionen</title>
  {:else}
    <title>D-sektionen</title>
  {/if}
</svelte:head>

<h1 class={twMerge("mb-4 text-2xl font-bold", clazz)}>
  {title}
  <slot name="after-title" />
</h1>
