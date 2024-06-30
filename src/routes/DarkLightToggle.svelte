<script lang="ts">
  import { page } from "$app/stores";
  import { twMerge } from "tailwind-merge";

  let clazz = "";
  export { clazz as class };

  let isCurrentThemeLight: boolean = $page.data["theme"] === "light";

  const toggleTheme = () => {
    const newTheme = isCurrentThemeLight ? "dark" : "light";
    const one_year = 60 * 60 * 24 * 365;
    document.cookie = `theme=${newTheme}; max-age=${one_year}; path=/; SameSite=Strict;`;
    document.documentElement.setAttribute("data-theme", newTheme);
    isCurrentThemeLight = newTheme === "light";
  };
</script>

<label class={twMerge("btn btn-ghost swap swap-rotate *:text-2xl", clazz)}>
  <!-- this hidden checkbox controls the state -->
  <input
    type="checkbox"
    bind:checked={isCurrentThemeLight}
    on:click={toggleTheme}
  />

  <!-- moon icon -->
  <span class="swap-on i-mdi-weather-night" />

  <!-- sun icon -->
  <span class="swap-off i-mdi-weather-sunny" />
</label>
