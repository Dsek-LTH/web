<script>
  import DarkmodeToggle from "./DarkmodeToggle.svelte";

  const { children } = $props();
</script>

<div class="p-2">
  <DarkmodeToggle />
</div>
{@render children?.()}
