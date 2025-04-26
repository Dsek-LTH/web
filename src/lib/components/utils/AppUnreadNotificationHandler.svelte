<script lang="ts">
  interface Props {
    notificationCount?: number | undefined;
  }

  let { notificationCount = undefined }: Props = $props();

  const sendNotificationCountToApp = async (count: number | undefined) => {
    if (count === undefined) return;
    // this event is listened to by the app, to update the badge count
    window.unreadNotificationCount = count; // set value, in case this is run before injected javascript by app
    window.dispatchEvent(
      // send event, in case app is ready and has event handler
      new CustomEvent("unreadNotificationCount", {
        detail: { count },
      }),
    );
  };

  $effect(() => {
    sendNotificationCountToApp(notificationCount);
  });
</script>
