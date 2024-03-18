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
    <div class="navbar justify-between p-2 pl-6 pr-4 shadow-md">
      <div class="flex gap-2">
        <DsekLogo className="size-6 text-primary" />
        <p class="font-thin">D-SEKTIONEN</p>
      </div>
      <div class="flex *:px-1">
        <label class="btn btn-ghost swap swap-rotate btn-sm rounded *:text-xl">
          <!-- this hidden checkbox controls the state -->
          <input type="checkbox" data-toggle-theme="dark,light" />

          <!-- moon icon -->
          <span class="swap-on i-mdi-weather-night" />

          <!-- sun icon -->
          <span class="swap-off i-mdi-weather-sunny" />
        </label>
        <div class="btn btn-ghost btn-sm rounded">
          {#if languageTag() === "sv"}
            <a href={i18n.route($page.url.pathname)} hreflang="en">EN</a>
          {:else if languageTag() === "en"}
            <a href={i18n.route($page.url.pathname)} hreflang="sv">SV</a>
          {/if}
        </div>
      </div>
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
