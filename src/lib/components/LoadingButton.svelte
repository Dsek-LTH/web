<script lang="ts">
  export let onClick: () => Promise<unknown>;
  let isLoading = false;
</script>

<button
  {...$$props}
  on:click={async () => {
    isLoading = true;
    await onClick();
    isLoading = false;
  }}
>
  {#if isLoading}
    <span class="loading" />
  {:else}
    <slot />
  {/if}
</button>
