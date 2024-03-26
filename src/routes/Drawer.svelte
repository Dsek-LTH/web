<script lang="ts">
  import { page } from "$app/stores";
  import { isAuthorized } from "$lib/utils/authorization";
  import { i18n } from "$lib/utils/i18n";
  import { languageTag } from "$paraglide/runtime";
  import DsekLogo from "./DsekLogo.svelte";
  import { routes } from "./routes";

  let checked = false;
  function close() {
    checked = !checked;
  }
</script>

<input id="main-drawer" type="checkbox" class="drawer-toggle" bind:checked />
<div class="drawer-side z-20">
  <label for="main-drawer" aria-label="close sidebar" class="drawer-overlay" />

  <ul class="menu min-h-full min-w-60 bg-base-200 p-0 font-semibold">
    <div class="flex gap-2 p-2 pb-0">
      <label class="btn btn-ghost swap swap-rotate flex-1 bg-base-300">
        <input type="checkbox" data-toggle-theme="dark,light" />
        <span class="swap-on i-mdi-weather-night size-6" />
        <span class="swap-off i-mdi-weather-sunny size-6" />
      </label>
      {#if languageTag() === "sv" || languageTag() === "en"}
        <a
          class="btn btn-ghost flex-1 bg-base-300"
          href={i18n.route($page.url.pathname)}
          hreflang={languageTag() === "sv" ? "en" : "sv"}
        >
          <span class="i-mdi-translate size-6" />
        </a>
      {/if}
    </div>

    <div class="p-2 pr-6">
      {#each routes as route (route.title)}
        {#if !route.accessRequired || isAuthorized(route.accessRequired, $page.data.user)}
          {#if route?.children?.length}
            <li class="py-1">
              <details>
                <summary class="active:!bg-primary/10">
                  {#if route.isDsekIcon}
                    <DsekLogo className="size-6 text-primary" />
                  {:else}
                    <span class={`${route.icon} size-6 text-primary`} />
                  {/if}
                  {route.title}
                </summary>
                <ul>
                  {#each route.children as child (child.title)}
                    {#if !child.accessRequired || isAuthorized(child.accessRequired, $page.data.user)}
                      <li class="py-1">
                        <a
                          on:click={close}
                          href={child.path}
                          class="active:!bg-primary/10"
                        >
                          <span class={`${child.icon} size-6 text-primary`} />
                          {child.title}
                        </a>
                      </li>
                    {/if}
                  {/each}
                </ul>
              </details>
            </li>
          {:else}
            <li class="py-1">
              <a
                on:click={close}
                href={route.path}
                class="active:!bg-primary/10"
              >
                {#if route.isDsekIcon}
                  <DsekLogo className="size-6 text-primary" />
                {:else}
                  <span class={`${route.icon} size-6 text-primary`} />
                {/if}
                {route.title}
              </a>
            </li>
          {/if}
        {/if}
      {/each}
    </div>
  </ul>
</div>
