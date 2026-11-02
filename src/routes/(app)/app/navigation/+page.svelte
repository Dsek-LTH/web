<script lang="ts">
  import { page } from "$app/state";
  import { Button } from "$lib/components/ui/button";
  import { isAuthorized } from "$lib/utils/authorization";
  import { ArrowRight, LogIn, LogOut, Settings, User } from "@lucide/svelte";
  import { getRoutes } from "../../../routes";
  import { m } from "$paraglide/messages";
  import MemberAvatar from "$lib/components/member/MemberAvatar.svelte";
  import { getFullName } from "$lib/utils/client/member";
  import { signIn, signOut } from "$lib/utils/auth";
  import type { PageData } from "../../../$types";

  let { data }: { data: PageData } = $props();

  const canAccess = (accessRequired: string | null) =>
    accessRequired === null || isAuthorized(accessRequired, page.data.user);

  const disallowedTitles: string[] = [m.applicant()];

  const visibleRoutes = $derived(
    getRoutes()
      .filter((route) => canAccess(route.accessRequired))
      .filter((route) => !disallowedTitles.includes(route.title))
      .map((route) => ({
        ...route,
        children: route.children?.filter((child) =>
          canAccess(child.accessRequired),
        ),
      })),
  );
</script>

<div class="layout-container flex flex-col justify-center gap-4">
  <div class="flex flex-row justify-between">
    <div class="flex flex-row items-center gap-2">
      {#if page.data.member}
        <a
          href="/members/me"
          class="hover:bg-secondary-hover flex flex-row items-center gap-2 rounded-md px-2"
        >
          <MemberAvatar member={page.data.member} />
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
            class="text-muted-foreground size-9"><Settings /></Button
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
        {#if !data.isApp}
          <a href="https://auth.dsek.se/if/flow/lu-signup/?next=%2F">
            <Button
              onclick={signIn}
              aria-label="sign in"
              variant="outline"
              class="text-muted-foreground h-9"
              ><User /> {m.navbar_register()}
            </Button>
          </a>
        {/if}
        <Button
          onclick={signIn}
          aria-label="sign in"
          variant="outline"
          class="text-muted-foreground h-9"><LogIn /> {m.navbar_logIn()}</Button
        >
      {/if}
    </div>
  </div>

  <div
    class="bg-muted-background flex w-full flex-col gap-2 rounded-lg border-[1px] p-4"
  >
    {#each visibleRoutes as route (route.title)}
      <div class="flex flex-col gap-2">
        <span class="text-muted-foreground">{route.title}</span>
        {#each route.children as child (child.title)}
          {@const Icon = child.icon}
          <Button
            variant="outline"
            size="lg"
            class="flex flex-row items-center justify-between rounded-md py-2"
            href={child.path}
            ><div class="flex flex-row items-center gap-2">
              <Icon size="16" class="text-rosa-400 max-w-4" />
              {child.title}
            </div>
            <ArrowRight />
          </Button>
        {/each}
      </div>
    {/each}
  </div>
</div>
