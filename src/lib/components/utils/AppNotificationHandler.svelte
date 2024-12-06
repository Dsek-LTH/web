<script lang="ts">
  import { page } from "$app/stores";
  import { toast } from "$lib/stores/toast";
  import { onDestroy, onMount } from "svelte";

  export let notificationsCountPromise: Promise<number> | number;
  let notificationCount: number | undefined = undefined;

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

  // we have this method to have a layer between the promise and number, such that if the promise changes, and then resolves to the same number, only one event will be sent to the app
  const updateLocalNotificationCount = async (
    countPromise: Promise<number> | number,
  ) => {
    const count = await countPromise;
    notificationCount = count;
  };

  $: (() => updateLocalNotificationCount(notificationsCountPromise))();
  $: (() => sendNotificationCountToApp(notificationCount))();

  // handle notification token from app
  const uploadToken = async (notificationToken: string) => {
    try {
      const res = await fetch("/api/notifications/uploadToken", {
        method: "POST",
        body: JSON.stringify({
          notificationToken,
        }),
      });
      if (!res.ok)
        toast(
          `Failed to upload notification token. ${
            (await res.json()).message ?? ""
          }`,
          "error",
        );
    } catch (e) {
      if (e instanceof Error) toast(e.message, "error");
      toast(`${e}`, "error");
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Javascript addEventListener returns any
  let listener: any | undefined = undefined;
  let token: string | null = null;
  $: loggedIn = !!$page.data.user?.memberId;
  onMount(() => {
    // read notification already stored in global window object

    listener = window.addEventListener("appSendNotificationToken", (event) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Detail does exist on our custom event
      const eventToken = (event as any).detail?.token as string | undefined;
      if (eventToken) token = eventToken;
    });
    const windowToken = window.notificationToken; // could be set before this is run
    if (windowToken) token = windowToken;
  });

  onDestroy(() => {
    if (listener)
      window.removeEventListener("appSendNotificationToken", listener);
  });

  $: (() => {
    if (loggedIn && token) uploadToken(token);
  })();
</script>
