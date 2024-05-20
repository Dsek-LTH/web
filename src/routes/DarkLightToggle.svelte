<script lang="ts">
  import { twMerge } from "tailwind-merge";

  let clazz = "";
  export { clazz as class };

  // Button can get the wrong state without this
  var theme: boolean;
</script>

<label class={twMerge("btn btn-ghost swap swap-rotate *:text-2xl", clazz)}>
  <!-- this hidden checkbox controls the state -->
  <input type="checkbox" data-toggle-theme="light,dark" bind:checked={theme} />

  <!-- moon icon -->
  <span class="swap-on i-mdi-weather-night" />

  <!-- sun icon -->
  <span class="swap-off i-mdi-weather-sunny" />
</label>
