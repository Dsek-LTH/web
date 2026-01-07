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
  import Settings from "@lucide/svelte/icons/settings";
  import LogIn from "@lucide/svelte/icons/log-in";
  import LogOut from "@lucide/svelte/icons/log-out";
  import User from "@lucide/svelte/icons/user";

  import { getRoutes } from "../routes";
  import { navigationMenuTriggerStyle } from "$lib/components/ui/navigation-menu/navigation-menu-trigger.svelte";
  import { page } from "$app/state";
  import { i18n } from "$lib/utils/i18n";
  import * as m from "$paraglide/messages";
  import { languageTag } from "$paraglide/runtime";
  import * as Drawer from "$lib/components/ui/drawer";
  import { onMount } from "svelte";
  import { getFullName, getInitials } from "$lib/utils/client/member";
  import { signIn, signOut } from "$lib/utils/auth";
  import ChevronUp from "@lucide/svelte/icons/chevron-up";

  import * as Popover from "$lib/components/ui/popover";

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

  let userPopover: boolean | undefined = $state();
  let popoverMove = false;

  function closePopover() {
    setTimeout(() => {
      if (!popoverMove) userPopover = false;
    }, 1000);
    popoverMove = false;
  }
</script>

<div
  class:visible
  class="nav-mobile bg-muted-background md-nav:top-0 md-nav:bottom-[unset] md-nav:h-[unset]! md-nav:relative fixed bottom-0 z-100 h-[64px] w-full max-w-screen flex-row justify-center border-t-[1px] border-b-[1px] font-[1.25rem]"
>
  <div
    class="md-nav:py-4 container mx-auto flex shrink flex-row items-center justify-between px-8 py-3 xl:px-32"
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
      {#if page.data.member}
        <Popover.Root open={userPopover}>
          <Popover.Trigger
            onmouseover={() => (userPopover = true)}
            onmouseleave={() => closePopover()}
          >
            <Avatar.Root class="md-nav:flex hidden">
              <Avatar.Image
                src={page.data.member?.picturePath}
                alt="profile picture"
              />
              <Avatar.Fallback>{getInitials(page.data.member)}</Avatar.Fallback>
            </Avatar.Root>
          </Popover.Trigger>
          <Popover.Content
            onmouseleave={() => (userPopover = false)}
            onmouseenter={() => (popoverMove = true)}
            class="z-150 flex max-w-[200px] flex-col items-center gap-2"
          >
            <Avatar.Root class="size-12">
              <Avatar.Image
                src={page.data.member?.picturePath}
                alt="profile picture"
              />
              <Avatar.Fallback>{getInitials(page.data.member)}</Avatar.Fallback>
            </Avatar.Root>
            <h5 class="text-center break-all">
              {getFullName(page.data.member)}
            </h5>
            <a href="/members/me">
              <Button
                aria-label="profile"
                variant="outline"
                class="text-muted-foreground"
                ><User /> {m.navbar_userMenu_profile()}</Button
              ></a
            >
            <a href="/settings">
              <Button
                aria-label="settings"
                variant="outline"
                class="text-muted-foreground"
                ><Settings /> {m.navbar_userMenu_settings()}</Button
              ></a
            >
            <Button
              aria-label="sign out"
              variant="outline"
              class="text-muted-foreground"
              onclick={signOut}><LogOut /> {m.navbar_userMenu_logOut()}</Button
            >
          </Popover.Content>
        </Popover.Root>
      {:else}
        <Button
          aria-label="sign in"
          variant="ghost"
          size="icon-lg"
          class="text-muted-foreground"
          onclick={signIn}><LogIn /></Button
        >
      {/if}
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
                  {#if page.data.member}
                    <a
                      href="/members/me"
                      class="hover:bg-secondary-hover flex flex-row items-center gap-2 rounded-md px-2"
                    >
                      <Avatar.Root>
                        <Avatar.Image
                          src={page.data.member?.picturePath}
                          alt="profile picture"
                        />
                        <Avatar.Fallback
                          >{getInitials(page.data.member)}</Avatar.Fallback
                        >
                      </Avatar.Root>
                      <p class="text-muted-foreground mt-0 font-medium">
                        <span>{getFullName(page.data.member)}</span>
                      </p>
                    </a>
                  {/if}
                </div>
                <div class="flex flex-row justify-between gap-2">
                  {#if page.data.member}
                    <a href="/settings">
                      <Button
                        aria-label="settings"
                        size="icon-lg"
                        variant="outline"
                        class="text-muted-foreground size-9"
                        ><Settings /></Button
                      ></a
                    >
                    <Button
                      onclick={signOut}
                      aria-label="sign out"
                      size="icon-lg"
                      variant="outline"
                      class="text-muted-foreground size-9"><LogOut /></Button
                    >
                  {:else}
                    <a href="https://auth.dsek.se/if/flow/lu-signup/?next=%2F">
                      <Button
                        onclick={signIn}
                        aria-label="sign in"
                        variant="outline"
                        class="text-muted-foreground h-9"
                        ><User /> {m.navbar_register()}</Button
                      ></a
                    >
                    <Button
                      onclick={signIn}
                      aria-label="sign in"
                      variant="outline"
                      class="text-muted-foreground h-9"
                      ><LogIn /> {m.navbar_logIn()}</Button
                    >
                  {/if}
                </div>
              </div>
            </Drawer.Title>
            <Drawer.Description class="flex flex-row justify-between">
              <div class="flex w-full flex-col">
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
                >
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
        <details open class="group list-none">
          <summary class="list-none">
            <h6
              class="text-muted-foreground hover:bg-secondary-hover m-1 flex w-full cursor-pointer flex-row items-center justify-between rounded-md px-[12px] py-[6px] font-normal"
            >
              {route.title}<ChevronDown
                class="ml-auto inline h-[16px] w-[16px] group-open:hidden"
              /><ChevronUp
                class="ml-auto hidden h-[16px] w-[16px] group-open:inline"
              />
            </h6>
          </summary>

          <div>
            <ul class="list-none border-l-[1px]">
              {#each route.children as child (child.title)}
                <a
                  class="hover:bg-secondary-hover text-foreground ml-[6px] block rounded-sm py-[6px] pr-[12px] pl-[6px] transition-all"
                  href={child.path}
                >
                  {child.title}
                </a>
              {/each}
            </ul>
          </div>
        </details>
      {:else}
        <a href={route.path} class="hover:bg-secondary-hover block rounded-sm">
          <h6 class="text-foreground m-1 block px-[12px] py-[6px] font-normal">
            <span class="">{route.title}</span>
          </h6>
        </a>
      {/if}
    {/each}
  </div>
{/snippet}

<CommandDialog bind:open={commandDialogOpen} />
