<script lang="ts">
  import { toast } from "$lib/stores/toast";
  import { onDestroy, onMount } from "svelte";

  // handle notification token from app
  const uploadToken = async (notificationToken: string) => {
    try {
      await fetch("/api/notifications/uploadToken", {
        method: "POST",
        body: JSON.stringify({
          notificationToken,
        }),
      });
    } catch (e) {
      if (e instanceof Error) toast(e.message, "error");
      toast(`${e}`, "error");
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Javascript addEventListener returns any
  let listener: any | undefined = undefined;
  onMount(() => {
    // read notification already stored in global window object

    listener = window.addEventListener("appSendNotificationToken", (event) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Detail does exist on our custom event
      const token = (event as any).detail?.token as string | undefined;
      if (token) uploadToken(token);
    });
    const notificationToken = window.notificationToken; // could be set before this is run
    if (notificationToken) uploadToken(notificationToken);
  });

  onDestroy(() => {
    if (listener)
      window.removeEventListener("appSendNotificationToken", listener);
  });
</script>
