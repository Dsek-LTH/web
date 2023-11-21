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
  <div class="h-16 overflow-auto bg-base-200 accent-primary"></div>

  <div class="flex-col overflow-auto pb-16 accent-primary md:pb-0 [&>*]:flex-1">
    <slot />
  </div>

  <BottomNav />
</NavBar>

<Toast />
