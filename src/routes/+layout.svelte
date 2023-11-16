<script lang="ts">
  import Toast from "$lib/components/Toast.svelte";
  import "../app.css";
  import BottomNav from "./BottomNav.svelte";
  import NavBar from "./NavBar.svelte";
</script>

<NavBar>
  <div class="overflow-auto bg-base-200 accent-primary" style="height: 4.4rem"></div>

  <div class="flex-col overflow-auto pb-16 accent-primary md:pb-0 [&>*]:flex-1">
    <slot />
  </div>

  <BottomNav />
</NavBar>

<Toast />
