<script lang="ts">
  export let onClick: (() => Promise<unknown> | void) | "default";
  export let isLoading = false;
</script>

<button
  disabled={isLoading}
  {...$$props}
  on:click={async () => {
    if (onClick === "default") return;
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
