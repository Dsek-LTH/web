<script lang="ts">
  export let title: string | undefined;
</script>

<svelte:head>
  {#if title}
    <title>{title} | D-sektionen</title>
  {:else}
    <title>D-sektionen</title>
  {/if}
</svelte:head>

<h1 class="mb-4 text-2xl font-bold">
  {title}
  <slot name="after-title" />
</h1>
