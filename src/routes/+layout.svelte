<script lang="ts">
  import { page } from "$app/stores";
  import { toast } from "$lib/stores/toast";
  import { getFlash } from "sveltekit-flash-message";
  import "../app.css";
  import Drawer from "./Drawer.svelte";
  import Navbar from "./Navbar.svelte";
  import Footer from "./Footer.svelte";

  const flash = getFlash(page);
  // Message from form (not redirect)
  $: $page.form?.form?.message && $page.form.form.message.type !== "hidden"
    ? toast($page.form.form.message.message, $page.form.form.message.type)
    : null;
  // Message from form on redirect
  $: $flash && $flash.type !== "hidden"
    ? toast($flash.message, $flash.type)
    : null;
</script>

<header class="contents">
  <nav class="contents" aria-label="Main"><Drawer /></nav>
  <nav class="contents" aria-label="Main"><Navbar /></nav>
</header>

<main class="flex-1">
  <slot />
</main>

<Footer />
