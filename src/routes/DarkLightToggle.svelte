<script lang="ts">
  import { twMerge } from "tailwind-merge";

  let clazz = "";
  export { clazz as class };
</script>

<label class={twMerge("btn btn-ghost swap swap-rotate *:text-2xl", clazz)}>
  <!-- this hidden checkbox controls the state -->
  <input type="checkbox" data-toggle-theme="dark,light" />

  <!-- moon icon -->
  <span class="swap-on i-mdi-weather-night" />

  <!-- sun icon -->
  <span class="swap-off i-mdi-weather-sunny" />
</label>
