<script lang="ts">
  import { page } from "$app/stores";
  import { isAuthorized } from "$lib/utils/authorization";
  import type { NotificationSchema } from "$lib/zod/schemas";
  import { signIn } from "@auth/sveltekit/client";
  import type { Notification } from "@prisma/client";
  import type { SuperValidated } from "sveltekit-superforms";
  import DarkLightToggle from "./DarkLightToggle.svelte";
  import DsekLogo from "./DsekLogo.svelte";
  import LanguageSwitcher from "./LanguageSwitcher.svelte";
  import NotificationBell from "./NotificationBell.svelte";
  import UserMenu from "./UserMenu.svelte";
  import { appBottomNavRoutes, getRoutes } from "./routes";
  import type { UserShopItemCounts } from "$lib/server/shop/countUserShopItems";
  import * as m from "$paraglide/messages";
  import EditButton from "./(app)/members/[studentId]/EditButton.svelte";
  import NavIcon from "./NavIcon.svelte";
  $: notifications = $page.data["notifications"] as Notification[] | null;
  $: deleteNotificationForm = $page.data[
    "deleteNotificationForm"
  ] as SuperValidated<NotificationSchema> | null;
  $: shopItemCounts = $page.data["shopItemCounts"] as UserShopItemCounts;
  $: routes = getRoutes();
  $: routesToShow = appBottomNavRoutes(routes);
</script>

<div class="btm-nav bg-base-200">
  {#each routesToShow as route (route.path)}
    <a href={route.path} class="text-primary">
      <NavIcon icon={route.icon} />
      <!-- <span class="btm-nav-label">{route.title}</span> -->
    </a>
  {/each}
</div>
