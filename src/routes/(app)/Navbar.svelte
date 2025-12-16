<script lang="ts">
  import * as NavigationMenu from "$lib/components/ui/navigation-menu/index.js";
  import DsekLogo from "$lib/components/DsekLogo.svelte";
  import * as Avatar from "$lib/components/ui/avatar/index.js";
  import { Button } from "$lib/components/ui/button";
  import CommandDialog from "$lib/components/search/CommandDialog.svelte";
  import Search from "@lucide/svelte/icons/search";
  import Languages from "@lucide/svelte/icons/languages";
  import Bell from "@lucide/svelte/icons/bell";
  import Menu from "@lucide/svelte/icons/menu";
  import ChevronDown from "@lucide/svelte/icons/chevron-down";
  import X from "@lucide/svelte/icons/x";
  import User from "@lucide/svelte/icons/user";
  import Settings from "@lucide/svelte/icons/settings";
  import LogOut from "@lucide/svelte/icons/log-out";

  import { getRoutes } from "../routes";
  import { navigationMenuTriggerStyle } from "$lib/components/ui/navigation-menu/navigation-menu-trigger.svelte";
  import { page } from "$app/state";
  import { i18n } from "$lib/utils/i18n";
  import { languageTag } from "$paraglide/runtime";
  import DarkmodeToggle from "./DarkmodeToggle.svelte";
  import * as Drawer from "$lib/components/ui/drawer";
  import { onMount } from "svelte";

  let commandDialogOpen = $state(false);

  let navOpen: boolean = $state(false);

  $effect(() => {
    if (navOpen == false) {
      setTimeout(() => (visible = true), 20);
    }
  });

  let oldScroll: number;
  let visible = $state(true);

  onMount(() => {
    window.onscroll = () => {
      if (window.innerWidth < 896) {
        if (window.scrollY > oldScroll) {
          visible = false;
        } else {
          visible = true;
        }
        oldScroll = window.scrollY;
      }
    };
  });
</script>

<div
  class:visible
  class="nav-mobile bg-muted-background md-nav:top-0 md-nav:bottom-[unset] md-nav:h-[unset]! md-nav:relative fixed bottom-0 z-100 h-[64px] w-full max-w-screen flex-row justify-center border-t-[1px] border-b-[1px] font-[1.25rem]"
>
  <div
    class="md-nav:py-4 md-nav:py-4 container mx-auto flex shrink flex-row items-center justify-between px-8 py-3 xl:px-32"
  >
    <div class="flex flex-row items-center">
      <NavigationMenu.Root viewport={false}>
        <NavigationMenu.List>
          <NavigationMenu.Item class="mr-4">
            <a href="/">
              <DsekLogo
                variant="letter"
                class="hover:fill-rosa-400 fill-rosa-400 size-6"
              />
            </a>
          </NavigationMenu.Item>
          {@render desktopLinks()}
        </NavigationMenu.List>
      </NavigationMenu.Root>
    </div>
    <div class="z-150 flex flex-row items-center gap-2">
      <Button
        aria-label="search (Ctrl+K)"
        size="icon-lg"
        variant="ghost"
        class="p-1.5"
        onclick={() => (commandDialogOpen = true)}><Search /></Button
      >
      <a
        href={i18n.route(page.url.pathname)}
        hreflang={languageTag() === "sv" ? "en" : "sv"}
        class="md-nav:inline-flex hidden"
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
      <DarkmodeToggle
        class="md-nav:inline-flex text-muted-foreground hidden border-0"
      />
      <Avatar.Root class="md-nav:flex hidden">
        <Avatar.Image src="https://picsum.photos/200" alt="profile picture" />
        <Avatar.Fallback>IK</Avatar.Fallback>
      </Avatar.Root>
      <Drawer.Root bind:open={navOpen} direction="bottom">
        {#if navOpen}
          <Drawer.Close
            ><Button
              aria-label="menubar"
              size="icon-lg"
              variant="ghost"
              class="md-nav:hidden block p-1.5"><X /></Button
            ></Drawer.Close
          >
        {:else}
          <Drawer.Trigger
            ><Button
              aria-label="menubar"
              size="icon-lg"
              variant="ghost"
              class="md-nav:hidden block p-1.5"><Menu /></Button
            ></Drawer.Trigger
          >{/if}
        <Drawer.Content class="mb-[64px]" compact>
          <Drawer.Header class="overflow-y-scroll">
            <Drawer.Title class="flex flex-col"
              ><div class="flex flex-row justify-between">
                <div class="flex flex-row items-center gap-2">
                  <Avatar.Root>
                    <Avatar.Image
                      src="https://picsum.photos/200"
                      alt="profile picture"
                    />
                    <Avatar.Fallback>IK</Avatar.Fallback>
                  </Avatar.Root>
                  <p class="text-muted-foreground mt-0 font-medium">Es Björn</p>
                </div>
                <div class="flex flex-row justify-between gap-2">
                  <a href="/members/me">
                    <Button
                      aria-label="profile"
                      size="icon-lg"
                      variant="outline"
                      class="text-muted-foreground size-9"><User /></Button
                    ></a
                  ><a href="/settings">
                    <Button
                      aria-label="settings"
                      size="icon-lg"
                      variant="outline"
                      class="text-muted-foreground size-9"><Settings /></Button
                    ></a
                  ><a href="#signout">
                    <Button
                      aria-label="sign out"
                      size="icon-lg"
                      variant="outline"
                      class="text-muted-foreground size-9"><LogOut /></Button
                    ></a
                  >
                </div>
              </div>
            </Drawer.Title>
            <Drawer.Description class="flex flex-row justify-between">
              <div class="flex flex-col">
                {@render mobileLinks()}
              </div>
              <div class="flex flex-col justify-end gap-1">
                <a
                  href={i18n.route(page.url.pathname)}
                  hreflang={languageTag() === "sv" ? "en" : "sv"}
                >
                  <Button
                    aria-label="languages"
                    size="icon-lg"
                    variant="outline"
                    class="text-muted-foreground size-9 p-1.5"
                    ><Languages /></Button
                  ></a
                ><DarkmodeToggle class="text-muted-foreground size-9 p-1.5" />
              </div></Drawer.Description
            >
          </Drawer.Header>
        </Drawer.Content>
      </Drawer.Root>
    </div>
  </div>
</div>

{#snippet desktopLinks()}
  {#each getRoutes() as route (route.title)}
    <NavigationMenu.Item class="md-nav:block hidden">
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
                  <div class="mt-4 mb-2 text-xl font-semibold text-[#ffffff]">
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
{/snippet}

{#snippet mobileLinks()}
  <div class="">
    {#each getRoutes() as route (route.title)}
      {#if route.children}
        <h6 class="text-foreground m-1 block p-1 text-lg font-medium">
          <ChevronDown class="mr-[2px] inline h-[16px] w-[16px]" />{route.title}
        </h6>

        <div>
          <ul
            class="ml-0 grid list-none pr-2 pb-2 pl-7 md:w-[400px] lg:w-[472px] lg:grid-cols-[.75fr_1fr]"
          >
            {#each route.children as child (child.title)}
              <a
                class="hover:bg-secondary-hover block rounded-sm px-1 py-1 transition-all"
                href={child.path}
              >
                {child.title}
              </a>
            {/each}
          </ul>
        </div>
      {:else}
        <a href={route.path} class="hover:bg-secondary-hover block rounded-sm">
          <h6 class="text-foreground m-1 block p-1 text-lg font-medium">
            <span class="ml-[18px]">{route.title}</span>
          </h6>
        </a>
      {/if}
    {/each}
  </div>
{/snippet}

<CommandDialog bind:open={commandDialogOpen} />
