<script lang="ts">
  import "../app.css";
  import Drawer from "./Drawer.svelte";
  import Footer from "./Footer.svelte";
  import LanguageProvider from "./LanguageProvider.svelte";
  import Navbar from "./Navbar.svelte";
  import Toast from "./Toast.svelte";
</script>

<LanguageProvider>
  <nav class="contents">
    <Navbar />
    <Drawer />
  </nav>

  <main class="flex-1">
    <slot />
  </main>

  <Toast />
  <Footer />
</LanguageProvider>
