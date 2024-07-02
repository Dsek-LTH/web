<script lang="ts">
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import * as m from "$paraglide/messages";
  import { signIn, signOut } from "@auth/sveltekit/client";
  import DarkLightToggle from "../../../DarkLightToggle.svelte";
  import LanguageSwitcher from "../../../LanguageSwitcher.svelte";
  import NavIcon from "$lib/components/NavIcon.svelte";

  export let data;
</script>

<SetPageTitle title={m.account()} />

<div class="flex flex-1 flex-col gap-4 rounded-box bg-base-300 p-2">
  {#if data.user && data.member}
    <ul class="menu gap-4 [&>li>a]:py-2">
      <li>
        <a href="/members/me">
          <NavIcon class="text-inherit" icon="i-mdi-account-circle" />
          {m.navbar_userMenu_profile()}
        </a>
      </li>
      <li>
        <a href="/settings">
          <NavIcon class="text-inherit" icon="i-mdi-cog" />
          {m.navbar_userMenu_settings()}
        </a>
      </li>
      <li>
        <a href="/shop/inventory">
          <NavIcon class="text-inherit" icon="i-mdi-treasure-chest" />
          {m.navbar_userMenu_inventory()}
        </a>
      </li>
    </ul>
  {/if}

  <div class="mx-6 my-2 flex justify-between gap-8 [&>*]:flex-1">
    <LanguageSwitcher class="btn-outline" />
    <DarkLightToggle class="btn-outline" />
  </div>
  {#if data.user && data.member}
    <button
      class="btn btn-outline btn-error mx-6 my-4 self-end"
      on:click={() => signOut()}
    >
      <NavIcon icon="i-mdi-logout" class="text-inherit" />
      {m.navbar_userMenu_logOut()}
    </button>
  {:else}
    <button
      class="btn btn-primary mx-6 my-4 self-stretch"
      on:click={() => signIn("keycloak")}
    >
      <NavIcon class="text-inherit" icon="i-mdi-login" />
      {m.navbar_logIn()}
    </button>
  {/if}
</div>
