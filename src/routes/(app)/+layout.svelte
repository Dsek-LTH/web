<script lang="ts">
  import "../../app.css";
  import Drawer from "./Drawer.svelte";
  import Footer from "./Footer.svelte";
  import Navbar from "./Navbar.svelte";
  import Toast from "./Toast.svelte";
  export let data;
</script>

<nav class="contents">
  <Navbar
    notifications={data.notifications}
    deleteNotificationForm={data.deleteNotificationForm}
  />
  <Drawer />
</nav>

<main class="flex-1">
  <slot />
</main>

<Toast />
<Footer />
