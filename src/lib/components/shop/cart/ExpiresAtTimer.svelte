<script lang="ts">
  import { invalidateAll } from "$app/navigation";
  import Timer from "$lib/components/Timer/Timer.svelte";
  import { now } from "$lib/stores/date";
  import { twMerge } from "tailwind-merge";

  let clazz: string | undefined = undefined;
  export { clazz as class };
  export let expiresAt: Date | null = null;

  $: if (expiresAt && $now > expiresAt) {
    invalidateAll();
  }
</script>

{#if expiresAt}
  <div class={twMerge("badge badge-primary", clazz)}>
    <Timer
      milliseconds={expiresAt.valueOf() - $now.valueOf()}
      class="w-[5ch] justify-center"
    />
  </div>
{/if}
