<script lang="ts">
  import { run } from "svelte/legacy";

  import { invalidateAll } from "$app/navigation";
  import Timer from "$lib/components/Timer/Timer.svelte";
  import { now } from "$lib/stores/date";
  import { twMerge } from "tailwind-merge";

  interface Props {
    class?: string | undefined;
    expiresAt?: Date | null;
  }

  let { class: clazz = undefined, expiresAt = null }: Props = $props();

  run(() => {
    if (expiresAt && $now > expiresAt) {
      invalidateAll();
    }
  });
</script>

{#if expiresAt}
  <div class={twMerge("badge badge-primary", clazz)}>
    <Timer
      milliseconds={expiresAt.valueOf() - $now.valueOf()}
      class="w-[5ch] justify-center"
    />
  </div>
{/if}
