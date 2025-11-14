<script>
  import DarkmodeToggle from "./DarkmodeToggle.svelte";
  import Navbar from "./Navbar.svelte";

  const { children } = $props();
</script>

<nav class="contents">
  <Navbar />
</nav>
<div class="p-2">
  <DarkmodeToggle />
</div>
{@render children?.()}
