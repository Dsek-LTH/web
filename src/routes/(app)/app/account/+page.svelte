<script lang="ts">
  import LoadingButton from "$lib/components/LoadingButton.svelte";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import NavIcon from "$lib/components/NavIcon.svelte";
  import * as m from "$paraglide/messages";
  import { signIn, signOut } from "@auth/sveltekit/client";
  import DarkLightToggle from "../../../DarkLightToggle.svelte";
  import LanguageSwitcher from "../../../LanguageSwitcher.svelte";
  export let data;
</script>

<SetPageTitle title={m.account()} />

<div class="flex flex-1 flex-col gap-4 rounded-box bg-base-300 p-2">
  <ul class="menu gap-4 [&>li>a]:py-2">
    {#if data.user && data.member}
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
    {/if}
    <li>
      <a class="pl-4" href="/privacy-policy">
        <NavIcon class="text-inherit" icon="i-mdi-account-lock" />
        {m.privacy_policy()}
      </a>
    </li>
    <!-- <li>
        <a href="/nollning">
          <NavIcon class="text-inherit" icon="i-mdi-cloud-outline" />
          {m.landing_theIntroduction()}
        </a>
      </li> -->
  </ul>

  <div class="mx-6 my-2 flex justify-between gap-8 [&>*]:flex-1">
    <LanguageSwitcher class="btn-outline" />
    <DarkLightToggle class="btn-outline" />
  </div>
  {#if data.user && data.member}
    <LoadingButton
      class="btn btn-outline btn-error mx-6 my-4 self-end"
      onClick={() => signOut()}
    >
      <NavIcon icon="i-mdi-logout" class="text-inherit" />
      {m.navbar_userMenu_logOut()}
    </LoadingButton>
  {:else}
    <LoadingButton
      class="btn btn-primary mx-6 my-4 self-stretch"
      onClick={() => signIn("keycloak")}
    >
      <NavIcon class="text-inherit" icon="i-mdi-login" />
      {m.navbar_logIn()}
    </LoadingButton>
  {/if}
</div>
