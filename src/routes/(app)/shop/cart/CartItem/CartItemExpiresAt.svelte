<script lang="ts">
  import Timer from "$lib/components/Timer/Timer.svelte";
  import { now } from "$lib/stores/date";

  export let expiresAt: Date | null = null;
</script>

{#if expiresAt}
  <div class="badge badge-primary">
    <Timer
      milliseconds={expiresAt.valueOf() - $now.valueOf()}
      class="w-[5ch] justify-center"
    />
  </div>
{/if}
