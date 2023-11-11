<script>
  import { onMount } from "svelte";
  import { themeChange } from "theme-change";

  onMount(() => {
    themeChange(false);
    // 👆 false parameter is required for svelte
  });
</script>

<label class="swap swap-rotate m-2">
  <!-- this hidden checkbox controls the state -->
  <input type="checkbox" data-toggle-theme="dark,light" data-act-class="ACTIVECLASS" />

  <!-- moon icon -->
  <span class="swap-on i-mdi-brightness-2 h-10 w-10"> </span>

  <!-- sun icon -->
  <span class="swap-off i-mdi-brightness-5 h-10 w-10"> </span>
</label>
