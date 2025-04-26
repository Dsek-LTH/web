<script lang="ts">
  import { run } from "svelte/legacy";

  import { page } from "$app/state";
  import NotificationModal from "$lib/components/NotificationModal.svelte";
  import type { NotificationGroup } from "$lib/utils/notifications/group";
  import type { NotificationSchema } from "$lib/zod/schemas";
  import type { SuperValidated } from "sveltekit-superforms";
  import { twMerge } from "tailwind-merge";
  import NotificationBellContent from "./NotificationBellContent.svelte";

  let internalModal: HTMLDialogElement = $state();

  // Get the number of unread notifications, which is then used to indicate the user

  // this is a somewhat ugly way to keep focus on the bell button after a notification is removed
  // if this is not here, whenever an action is taken (such as removing a notification), the form will cause the elements to lose focus and the menu will close
  let bellButton: HTMLButtonElement = $state();
  const onDeleted = () => {
    bellButton.focus();
  };
  interface Props {
    notificationsPromise: Promise<NotificationGroup[]>;
    form: SuperValidated<NotificationSchema>;
    useModalInstead?: boolean;
    externalModal?: HTMLDialogElement | undefined;
    buttonClass?: string | undefined;
    postReveal?: boolean;
    notifications?: NotificationGroup[] | undefined;
    onRead?: any;
    children?: import("svelte").Snippet<[any]>;
    loading?: import("svelte").Snippet;
  }

  let {
    notificationsPromise,
    form,
    useModalInstead = false,
    externalModal = undefined,
    buttonClass = undefined,
    postReveal = false,
    notifications = $bindable(undefined),
    onRead = (id: number | "all") => {
      if (id === "all") {
        notifications = notifications?.map((notification) => ({
          ...notification,
          readAt: new Date(),
        }));
      } else {
        notifications = notifications?.map((notification) =>
          notification.id === id
            ? {
                ...notification,
                readAt: new Date(),
              }
            : notification,
        );
      }
    },
    children,
    loading,
  }: Props = $props();
  run(() => {
    (() => {
      notificationsPromise.then((loadedNotifications) => {
        notifications = loadedNotifications;
      });
    })();
  });
  run(() => {
    (() => {
      if (page.form?.form?.data?.notificationId !== undefined) {
        // a notification was removed
        setTimeout(() => {
          // needs to be done next update cycle, otherwise it doesn' work. In practice, is still instant
          onDeleted();
        });
      }
    })();
  });
</script>

<div class="dropdown">
  <!-- When user clicks on the bell icon, it will update all notifications as read -->
  <button
    bind:this={bellButton}
    type="button"
    onclick={externalModal || useModalInstead
      ? () => (externalModal ?? internalModal).showModal()
      : undefined}
    tabindex="0"
    class={twMerge("btn btn-ghost *:text-xl", buttonClass)}
    data-dropdown-toggle="dropdown"
  >
    {#if notifications !== undefined}
      {@const unreadCount = notifications.filter(
        (data) => data.readAt == null,
      ).length}
      {#if children}{@render children({ unreadCount })}{:else}
        {#if unreadCount <= 0}
          <span class="i-mdi-bell-outline"></span>
        {/if}
        {#if unreadCount > 0}
          <span class="i-mdi-bell-ring-outline animate-bounce"></span>
          <span
            class="absolute right-0 top-0 flex h-6 w-6 items-center justify-center rounded-box bg-red-600 text-center !text-sm"
            >{unreadCount}</span
          >
        {/if}
      {/if}
    {:else}
      {#await notificationsPromise}
        {#if loading}{@render loading()}{:else}
          <span class="i-mdi-bell-outline mx-auto"></span>
        {/if}
      {/await}
    {/if}
  </button>

  {#if !externalModal && useModalInstead}
    <NotificationModal
      {postReveal}
      bind:modal={internalModal}
      {onRead}
      bind:notifications
    />
  {:else if !externalModal}
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <ul
      tabindex="0"
      class="menu dropdown-content !fixed right-0 z-[1] max-h-[80svh] w-full flex-nowrap overflow-clip rounded-box bg-base-100 p-0 shadow sm:!absolute sm:w-[27rem]"
    >
      {#if notifications !== undefined}
        <NotificationBellContent
          {notifications}
          {postReveal}
          {onDeleted}
          {form}
          {onRead}
        />
      {:else}
        {#await notificationsPromise}
          <span class="loading loading-lg"></span>
        {/await}
      {/if}
    </ul>
  {/if}
</div>
