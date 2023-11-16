<script lang="ts">
  import { page } from "$app/stores";
  import Toast from "$lib/components/Toast.svelte";
  import { toast } from "$lib/stores/toast";
  import { getFlash } from "sveltekit-flash-message";
  import "../app.css";
  import BottomNav from "./BottomNav.svelte";
  import NavBar from "./NavBar.svelte";

  const flash = getFlash(page);
  // Message from form (not redirect)
  $: $page.form?.form?.message && $page.form.form.message.type !== "hidden"
    ? toast($page.form.form.message.message, $page.form.form.message.type)
    : null;
  // Message from form on redirect
  $: $flash && $flash.type !== "hidden" ? toast($flash.message, $flash.type) : null;
</script>

<NavBar>
  <div
    class="h-[calc(100vh-9rem)] flex-col overflow-auto pb-8 accent-primary md:h-[calc(100vh-5rem)] [&>*]:flex-1"
  >
    <slot />
  </div>

  <BottomNav />
</NavBar>

<Toast />
