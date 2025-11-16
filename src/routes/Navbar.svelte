<script lang="ts">
  import * as NavigationMenu from "$lib/components/ui/navigation-menu/index.js";
  import DsekLogo from "$lib/components/DsekLogo.svelte";
  import * as Avatar from "$lib/components/ui/avatar/index.js";
  import { Button } from "$lib/components/ui/button";
  import Search from "@lucide/svelte/icons/search";
  import Languages from "@lucide/svelte/icons/languages";
  import Bell from "@lucide/svelte/icons/bell";
  import { getRoutes } from "./routes";
  import { navigationMenuTriggerStyle } from "$lib/components/ui/navigation-menu/navigation-menu-trigger.svelte";
  import { page } from "$app/state";
  import { i18n } from "$lib/utils/i18n";
  import { languageTag } from "$paraglide/runtime";
</script>

<div class=" flex min-w-screen flex-row justify-center border-b-[1px]">
  <div
    class="container mx-auto flex flex-row items-center justify-between px-8 py-4 xl:px-32"
  >
    <div class="flex flex-row items-center">
      <NavigationMenu.Root viewport={false}>
        <NavigationMenu.List>
          <NavigationMenu.Item>
            <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
            <a href="/">
              <DsekLogo
                variant="letter"
                class="hover:fill-rosa-400 fill-rosa-400 size-6"
              />
            </a>
          </NavigationMenu.Item>
          {#each getRoutes() as route (route.title)}
            <NavigationMenu.Item>
              {#if route.children}
                <NavigationMenu.Trigger>{route.title}</NavigationMenu.Trigger>

                <NavigationMenu.Content>
                  <ul
                    class="ml-0 grid list-none gap-2 p-2 md:w-[400px] lg:w-[472px] lg:grid-cols-[.75fr_1fr]"
                  >
                    {#if route.pictureUrl}
                      <li class="row-span-3">
                        <NavigationMenu.Link
                          class={`flex h-full w-full flex-col justify-end rounded-md bg-linear-to-t bg-[linear-gradient(to_top,rgba(0,0,0,1),rgba(0,0,0,0)),url('${route.pictureUrl}')] bg-cover bg-center p-6 no-underline outline-hidden select-none focus:shadow-md`}
                          href={route.picturePath}
                        >
                          <div
                            class="mt-4 mb-2 text-xl font-semibold text-[#ffffff]"
                          >
                            {route.pictureTitle}
                          </div>
                          <p class="text-sm leading-tight text-[#ffffff]">
                            {route.pictureDescription}
                          </p>
                        </NavigationMenu.Link>
                      </li>
                    {/if}
                    {#each route.children as child (child.title)}
                      <NavigationMenu.Link href={child.path}>
                        <NavigationMenu.ContentItem
                          title={child.title}
                          description={child.description ?? ""}
                        />
                      </NavigationMenu.Link>
                    {/each}
                  </ul>
                </NavigationMenu.Content>
              {:else}
                <NavigationMenu.Link
                  href={route.path}
                  class={navigationMenuTriggerStyle()}
                >
                  {route.title}
                </NavigationMenu.Link>
              {/if}
            </NavigationMenu.Item>
          {/each}
        </NavigationMenu.List>
      </NavigationMenu.Root>
    </div>
    <div class="flex flex-row items-center gap-2">
      <Button
        aria-label="search button"
        size="icon-lg"
        variant="ghost"
        class="p-1.5"><Search /></Button
      >
      <a
        href={i18n.route(page.url.pathname)}
        hreflang={languageTag() === "sv" ? "en" : "sv"}
      >
        <Button
          aria-label="languages"
          size="icon-lg"
          variant="ghost"
          class="p-1.5"><Languages /></Button
        ></a
      >
      <Button
        aria-label="notifications"
        size="icon-lg"
        variant="ghost"
        class="p-1.5"><Bell /></Button
      >
      <Avatar.Root>
        <Avatar.Image src="https://picsum.photos/200" alt="profile picture" />
        <Avatar.Fallback>IK</Avatar.Fallback>
      </Avatar.Root>
    </div>
  </div>
</div>
<!--
<script lang="ts">
  import { languageTag, onSetLanguageTag } from "$paraglide/runtime";
  import { page } from "$app/stores";
  import { i18n } from "$lib/utils/i18n";
  import { invalidateAll } from "$app/navigation";
  import { twMerge } from "tailwind-merge";
  import { browser } from "$app/environment";

  let clazz = "";
  export { clazz as class };

  if (browser) {
    onSetLanguageTag(() => {
      invalidateAll();
    });
  }
</script>

<a
  class={twMerge("btn btn-ghost", clazz)}
  href={i18n.route($page.url.pathname)}
  hreflang={languageTag() === "sv" ? "en" : "sv"}
>
  <slot>
    {languageTag() === "sv" ? "EN" : "SV"}
  </slot>
</a>-->
