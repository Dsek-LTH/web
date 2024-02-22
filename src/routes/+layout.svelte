<script lang="ts">
  import { i18n } from "$lib/utils/i18n";
  import { ParaglideJS } from "@inlang/paraglide-js-adapter-sveltekit";
  import "../app.css";
  import Drawer from "./Drawer.svelte";
  import Footer from "./Footer.svelte";
  import Navbar from "./Navbar.svelte";
  import Toast from "./Toast.svelte";
  export let data;
</script>

<ParaglideJS {i18n}>
  <nav class="contents">
    <Navbar notifications={data.notifications} />
    <Drawer />
  </nav>

  <main class="flex-1">
    <slot />
  </main>

  <Toast />
  <Footer />
</ParaglideJS>
