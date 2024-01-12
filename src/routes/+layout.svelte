<script lang="ts">
  import "../app.css";
  import Drawer from "./Drawer.svelte";
  import Footer from "./Footer.svelte";
  import LanguageProvider from "./LanguageProvider.svelte";
  import Navbar from "./Navbar.svelte";
  import Toast from "./Toast.svelte";
</script>

<LanguageProvider>
  <header class="contents">
    <nav class="contents" aria-label="Main"><Drawer /></nav>
    <nav class="contents" aria-label="Main"><Navbar /></nav>
  </header>

  <main class="flex-1">
    <slot />
  </main>

  <Footer />

  <Toast />
</LanguageProvider>
