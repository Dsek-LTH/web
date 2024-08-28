<script lang="ts">
  import { navigating } from "$app/stores";

  const threshhold = 100;
  let isLoadDelayed = false;
  let timeout: ReturnType<typeof setTimeout>;
  $: {
    if ($navigating) {
      timeout = setTimeout(() => {
        isLoadDelayed = $navigating !== null;
      }, threshhold);
    } else {
      if (timeout) clearTimeout(timeout);
      isLoadDelayed = false;
    }
  }
</script>

<div
  class:opacity-0={!isLoadDelayed}
  class="pointer-events-none fixed inset-0 grid place-items-center transition-opacity duration-500"
>
  <slot />
</div>
