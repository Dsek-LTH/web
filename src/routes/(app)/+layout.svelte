<script lang="ts">
  import GlobalAlert from "$lib/components/GlobalAlert.svelte";
  import { languageTag } from "$paraglide/runtime";
  import { onMount } from "svelte";
  import { themeChange } from "theme-change";
  import "../../app.css";
  import Drawer from "../Drawer.svelte";
  import Footer from "../Footer.svelte";
  import Navbar from "../Navbar.svelte";
  import Toast from "../Toast.svelte";

  onMount(() => {
    themeChange(false);
    // 👆 false parameter is required for svelte
  });

  export let data;
</script>

<nav class="contents">
  <Navbar />
  <Drawer />
</nav>

{#each data.alerts as alert}
  <GlobalAlert
    message={languageTag() === "sv" ? alert.message : alert.messageEn}
    severity={alert.severity}
  />
{/each}

<main class="flex-1">
  <slot />
</main>

<Toast />
<Footer />
