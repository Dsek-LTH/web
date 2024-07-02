<script lang="ts">
  import type { UserShopItemCounts } from "$lib/server/shop/countUserShopItems";
  import { getFullName } from "$lib/utils/client/member";
  import { signOut } from "@auth/sveltekit/client";
  import type { Member } from "@prisma/client";
  import type { AuthUser } from "@zenstackhq/runtime";
  import * as m from "$paraglide/messages";
  import LoadingButton from "$lib/components/LoadingButton.svelte";

  export let member: Member;
  export let user: AuthUser;
  export let shopItemCounts: UserShopItemCounts;

  $: amountInCart =
    (shopItemCounts?.inCart ?? 0) + (shopItemCounts?.reserved ?? 0);
  $: userIndicatorAmount = amountInCart > 0 ? amountInCart : undefined;
</script>

<div class="dropdown dropdown-end dropdown-hover">
  <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
  <!-- svelte-ignore a11y-label-has-associated-control -->
  <label tabindex="0" class="btn btn-ghost">
    {#if userIndicatorAmount !== undefined}
      <div class="indicator">
        <span
          class="badge indicator-item badge-primary badge-sm indicator-start indicator-top"
          >{amountInCart}</span
        >
        <span class="i-mdi-account-circle text-2xl" />
      </div>
    {:else}
      <span class="i-mdi-account-circle text-2xl" />
    {/if}
  </label>
  <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
  <div
    tabindex="0"
    class="card dropdown-content card-compact z-[1] w-max bg-base-200 p-2 text-center text-base-content shadow"
  >
    <div class="card-body">
      <p class="text-center font-semibold">{m.navbar_userMenu_loggedInAs()}</p>
      <h3 class="text-xl font-bold">
        {getFullName(member)}
      </h3>
      <p class="text-sm">({user?.studentId})</p>
      <span class="divider m-1" />

      <div class="flex flex-col items-start gap-2">
        <a
          href={`/members/me`}
          class="btn btn-ghost w-full justify-start text-base-content"
        >
          <span class="i-mdi-account-circle size-6 text-primary" />
          {m.navbar_userMenu_profile()}
        </a>
        <a href="/settings" class="btn btn-ghost w-full justify-start">
          <span class="i-mdi-cog size-6 text-primary" />
          {m.navbar_userMenu_settings()}
        </a>
        <a href="/shop/inventory" class="btn btn-ghost w-full justify-start">
          <span class="i-mdi-treasure-chest size-6 text-primary" />
          {m.navbar_userMenu_inventory()}
        </a>
        {#if amountInCart > 0}
          <a href="/shop/cart" class="btn btn-ghost w-full justify-start">
            <span class="i-mdi-cart size-6 text-primary" />
            <span>{m.navbar_userMenu_cart()}</span>
            <span class="badge badge-primary badge-sm">{amountInCart}</span>
          </a>
        {/if}
      </div>
      <span class="divider m-1" />
      <LoadingButton
        class="btn btn-ghost justify-start"
        onClick={() => signOut()}
      >
        <span class="i-mdi-logout size-6 text-primary" />
        {m.navbar_userMenu_logOut()}
      </LoadingButton>
    </div>
  </div>
</div>
