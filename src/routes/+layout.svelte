<script lang="ts">
  import "../app.css";
  import BottomNav from "./BottomNav.svelte";
  import NavBar from "./NavBar.svelte";
  export let data;
</script>

<NavBar accessPolicies={data.accessPolicies}>
  <div
    class="h-[calc(100vh-9rem)] flex-col overflow-auto pb-8 accent-primary md:h-[calc(100vh-5rem)] [&>*]:flex-1"
  >
    <slot />
  </div>

  <BottomNav />
</NavBar>
