<script lang="ts">
  import { page } from "$app/stores";
  import "../app.css";
  import DsekLogo from "$lib/components/DsekLogo.svelte";
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
  <ul class="menu min-h-full bg-base-200 pr-6">
    {#each routes as route (route.title)}
      {#if !route.accessRequired || accessPolicies.includes(route.accessRequired)}
        {#if route?.children?.length}
          <li>
            <span class="btn content-center justify-start">
              {#if route.isDsekIcon}
                <DsekLogo className="h-6 w-6 text-primary" />
              {:else}
                <span class={`${route.icon} h-6 w-6 text-primary`} />
              {/if}
              {route.title}</span
            >
            <ul>
              {#each route.children as child (child.title)}
                {#if !child.accessRequired || accessPolicies.includes(child.accessRequired)}
                  <li>
                    <a
                      on:click={close}
                      href={child.path}
                      class="btn content-center justify-start"
                    >
                      <span class={`${child.icon} h-6 w-6 text-primary`} />
                      {child.title}
                    </a>
                  </li>
                {/if}
              {/each}
            </ul>
          </li>
        {:else}
          <li>
            <a
              on:click={close}
              href={route.path}
              class="btn content-center justify-start"
            >
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
