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
  <input
    type="checkbox"
    data-toggle-theme="dark,light"
    data-act-class="ACTIVECLASS"
  />

  <!-- moon icon -->
  <span class="swap-on i-mdi-weather-night h-8 w-8"> </span>

  <!-- sun icon -->
  <span class="swap-off i-mdi-weather-sunny h-8 w-8"> </span>
</label>
