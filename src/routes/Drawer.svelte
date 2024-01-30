<script lang="ts">
  import { page } from "$app/stores";
  import DsekLogo from "./DsekLogo.svelte";
  import { routes } from "./routes";
  $: accessPolicies = $page.data.accessPolicies;

  let checked = false;
  function close() {
    checked = !checked;
  }
</script>

<input id="main-drawer" type="checkbox" class="drawer-toggle" bind:checked />
<div class="drawer-side z-20">
  <label for="main-drawer" aria-label="close sidebar" class="drawer-overlay"
  ></label>
  <ul class="menu min-h-full min-w-60 bg-base-200 pr-6 font-semibold">
    {#each routes as route (route.title)}
      {#if !route.accessRequired || accessPolicies.includes(route.accessRequired)}
        {#if route?.children?.length}
          <li class="py-1">
            <details open>
              <summary class="active:!bg-primary/10">
                {#if route.isDsekIcon}
                  <DsekLogo className="h-6 w-6 text-primary" />
                {:else}
                  <span class={`${route.icon} h-6 w-6 text-primary`} />
                {/if}
                {route.title}
              </summary>
              <ul>
                {#each route.children as child (child.title)}
                  {#if !child.accessRequired || accessPolicies.includes(child.accessRequired)}
                    <li class="py-1">
                      <a
                        on:click={close}
                        href={child.path}
                        class="active:!bg-primary/10"
                      >
                        <span class={`${child.icon} h-6 w-6 text-primary`} />
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
            <a on:click={close} href={route.path} class="active:!bg-primary/10">
              {#if route.isDsekIcon}
                <DsekLogo className="h-6 w-6 text-primary" />
              {:else}
                <span class={`${route.icon} h-6 w-6 text-primary`} />
              {/if}
              {route.title}
            </a>
          </li>
        {/if}
      {/if}
    {/each}
  </ul>
</div>
