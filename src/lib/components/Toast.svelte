<script lang="ts">
  import { fade } from "svelte/transition";
  import { toasts } from "$lib/stores/toast";
</script>

{#if $toasts}
  <div class="toast">
    {#each $toasts as toast (toast.id)}
      <div role="alert" class="alert alert-{toast.type}" out:fade={{ duration: 750 }}>
        {toast.message}
      </div>
    {/each}
  </div>
{/if}
