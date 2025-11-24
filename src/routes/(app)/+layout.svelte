<script>
  import Footer from "./Footer.svelte";
  import Navbar from "./Navbar.svelte";
  import DarkmodeToggle from "./DarkmodeToggle.svelte";

  const { children } = $props();
</script>

<nav class="contents">
  <Navbar />
</nav>
<div class="p-2">
  <DarkmodeToggle />
</div>
{@render children?.()}
<Footer />
