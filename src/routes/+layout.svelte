<script lang="ts">
  import "../app.css";
  import BottomNav from "./BottomNav.svelte";
  import NavBar from "./NavBar.svelte";
  export let data;
</script>

<NavBar accessPolicies={data.accessPolicies} />

<div class="overflow-auto accent-primary">
  <slot />
</div>

<BottomNav />
