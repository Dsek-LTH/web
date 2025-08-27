<script lang="ts">
  import { superForm } from "$lib/utils/client/superForms";
  import type { NotificationGroup } from "$lib/utils/notifications/group";
  import type { NotificationSchema } from "$lib/zod/schemas";
  import type { SuperValidated } from "sveltekit-superforms";

  export let form: SuperValidated<NotificationSchema>;
  export let modal: HTMLDialogElement;
  export let notifications: NotificationGroup[] | undefined = undefined;
  export let allowDelete = true;
  export let postReveal = false;
  export let onRead = (id: number | "all") => {
    console.log("onRead");
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
    notifications = notifications;
    console.log(notifications?.filter((n) => !n.readAt).length);
  };

  const { enhance: readEnhance } = superForm(form, {
    id: "readNotifications",
    onSubmit: () => {
      onRead("all");
    },
  });
</script>

hejsan
