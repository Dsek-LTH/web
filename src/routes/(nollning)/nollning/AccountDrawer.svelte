<script lang="ts">
  import { page } from "$app/stores";
  import { getFullName } from "$lib/utils/client/member";

  let checked = false;
  $: member = $page.data.member;
</script>

<div class="drawer-end">
  <input
    id="nolla-account-drawer"
    type="checkbox"
    class="drawer-toggle"
    bind:checked
  />
  <div class="drawer-side z-20">
    <label
      for="nolla-account-drawer"
      aria-label="close sidebar"
      class="drawer-overlay"
    />

    <!-- Drawer content -->
    <aside
      class="flex min-h-full max-w-72 flex-col items-end rounded-box rounded-r-none bg-base-100 px-4 py-6 pl-8 md:max-w-80"
    >
      {#if member}
        <div class="flex items-start justify-end gap-2">
          <span class="max-w-32 text-right font-medium"
            >{getFullName({
              ...member,
              nickname: null,
            })}</span
          >
          <label
            for="nolla-account-drawer"
            aria-label="open account sidebar"
            class="btn btn-circle aspect-square size-10 !p-0"
          >
            <span class="i-mdi-account-outline size-8" />
          </label>
        </div>
      {/if}
      <ul class="menu -mr-6 mt-4 items-end *:text-right">
        <li>
          <a href="/members/me">Profil</a>
        </li>
        <li>
          <a href="/settings">Inställningar</a>
        </li>
        <li>
          <a href="/shop/inventory">Mina biljetter</a>
        </li>
      </ul>
      <a href="/" class="btn-primary-dark btn mt-8 self-center">
        till dsek <span class="i-mdi-arrow-right" />
      </a>
    </aside>
  </div>
</div>
