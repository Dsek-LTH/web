<script>
  import NotImplemented from "$lib/components/NotImplemented.svelte";
  import Footer from "./(app)/Footer.svelte";
  import * as Kbd from "$lib/components/ui/kbd/index";
  import Navbar from "./(app)/Navbar.svelte";
</script>

<nav class="contents">
  <Navbar />
</nav>

<div class="flex flex-col items-center gap-4">
  <Kbd.Group>
    <Kbd.Root symbol="CTRL" trigger="Control"/>
    <span>+</span>
    <Kbd.Root symbol="Y"/>
  </Kbd.Group>
</div>

<Footer />

