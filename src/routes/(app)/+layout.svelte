<script>
  import Footer from "./Footer.svelte";
  import Navbar from "./Navbar.svelte";

  const { children } = $props();
</script>

<Navbar />
{@render children?.()}
<Footer />
