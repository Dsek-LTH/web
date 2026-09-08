<script lang="ts">
  import MemberAvatar from "$lib/components/member/MemberAvatar.svelte";
  import { Button } from "$lib/components/ui/button/index.js";
  import { getFullName } from "$lib/utils/client/member";
  import { signIn, signOut } from "$lib/utils/auth";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import * as m from "$paraglide/messages.js";
  import User from "@lucide/svelte/icons/user";
  import Settings from "@lucide/svelte/icons/settings";
  import LogOut from "@lucide/svelte/icons/log-out";
  import { page } from "$app/state";

  let member = $derived(page.data.member);
</script>

<SetPageTitle title={m.account()} />

<div class="layout-container">
  <div class="mx-auto flex max-w-sm flex-col items-center gap-6 py-8">
    {#if member}
      <MemberAvatar {member} class="size-24" />
      <div class="flex flex-col items-center gap-1 text-center">
        <h1 class="text-2xl font-bold">{getFullName(member)}</h1>
        {#if member.email}
          <p class="text-muted-foreground">{member.email}</p>
        {/if}
        {#if member.studentId}
          <p class="text-muted-foreground text-sm">{member.studentId}</p>
        {/if}
      </div>

      <div class="flex w-full flex-col gap-3">
        <Button
          href="/members/me"
          variant="outline"
          class="flex items-center justify-center gap-2"
        >
          <User class="h-4 w-4" />
          {m.navbar_userMenu_profile()}
        </Button>
        <Button
          href="/settings"
          variant="outline"
          class="flex items-center justify-center gap-2"
        >
          <Settings class="h-4 w-4" />
          {m.navbar_userMenu_settings()}
        </Button>
        <Button
          onclick={signOut}
          variant="outline"
          class="flex items-center justify-center gap-2"
        >
          <LogOut class="h-4 w-4" />
          {m.navbar_userMenu_logOut()}
        </Button>
      </div>
    {:else}
      <p class="text-muted-foreground text-center">{m.navbar_logIn()}</p>
      <Button onclick={signIn}>{m.navbar_logIn()}</Button>
    {/if}
  </div>
</div>
