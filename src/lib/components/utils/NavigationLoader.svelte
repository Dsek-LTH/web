<!-- @migration task: review uses of `navigating` -->
<script lang="ts">
  import { run } from "svelte/legacy";

  import { navigating } from "$app/state";
  interface Props {
    children?: import("svelte").Snippet;
  }

  let { children }: Props = $props();

  const threshhold = 100;
  let isLoadDelayed = $state(false);
  let timeout: ReturnType<typeof setTimeout> = $state();
  run(() => {
    if (navigating) {
      timeout = setTimeout(() => {
        isLoadDelayed = navigating !== null;
      }, threshhold);
    } else {
      if (timeout) clearTimeout(timeout);
      isLoadDelayed = false;
    }
  });
</script>

<div
  class:opacity-0={!isLoadDelayed}
  class="pointer-events-none fixed inset-0 grid place-items-center transition-opacity duration-500"
>
  {@render children?.()}
</div>
