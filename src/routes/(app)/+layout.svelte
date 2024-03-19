<script lang="ts">
  import "../../app.css";
  import Drawer from "../Drawer.svelte";
  import Footer from "../Footer.svelte";
  import Navbar from "../Navbar.svelte";
  import Toast from "../Toast.svelte";
</script>

<nav class="contents">
  <Navbar />
  <Drawer />
</nav>

<main class="flex-1">
  <slot />
</main>

<Toast />
<Footer />
