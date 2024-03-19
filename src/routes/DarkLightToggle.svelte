<script lang="ts">
  import { onMount } from "svelte";
  import { themeChange } from "theme-change";

  onMount(() => {
    themeChange(false);
    // 👆 false parameter is required for svelte
  });
</script>

<label class="btn btn-ghost swap swap-rotate *:text-2xl">
  <!-- this hidden checkbox controls the state -->
  <input type="checkbox" data-toggle-theme="dark,light" />

  <!-- moon icon -->
  <span class="swap-on i-mdi-weather-night" />

  <!-- sun icon -->
  <span class="swap-off i-mdi-weather-sunny" />
</label>
