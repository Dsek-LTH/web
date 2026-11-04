<script lang="ts">
  import { page } from "$app/stores";
  import { toast } from "$lib/stores/toast";
  import { onDestroy, onMount } from "svelte";

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
