<script lang="ts">
  import { enhance } from "$app/forms";
  // Function to call to remove from the actual list
  export let removeFunc: (id: number) => void;
  export let memberId: string | undefined;
  export let notification: {
    id: number;
    title: string;
    message: string;
    type: string;
    link: string;
    readAt: Date | null;
    memberId: string;
    createdAt: Date;
    updatedAt: Date;
    fromAuthorId: string | null;
  };

  // Gets hours, minutes and seconds and then returns hour, if it's been at least 59 minutes,
  // returns seconds if it's been less than a minute, and else minutes
  const time = () => {
    const seconds = Math.floor(
      (new Date().getTime() - notification.createdAt.getTime()) / 1000,
    );
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    return minutes < 1 && hours < 1
      ? seconds + " sekunder"
      : hours < 1
        ? minutes + " minuter"
        : hours + " timmar";
  };
</script>

<div class="relative m-0 rounded-none">
  <a
    href={notification.link}
    class="flex h-full w-80 max-w-80 flex-col justify-center"
  >
    <span class="my-1 w-11/12 truncate text-lg font-bold"
      >{notification.title}</span
    >
    <span class="w-11/12 truncate text-wrap text-xs"
      >{notification.message}</span
    >
    <span class="w-11/12 truncate text-wrap text-xs text-gray-500">
      {time() + " sedan"}
    </span>
  </a>
  <!-- Deletes this notification -->
  <form
    method="POST"
    action="/?/deletenotification"
    use:enhance={() => {
      return () => {
        removeFunc(notification.id);
      };
    }}
  >
    <input type="hidden" name="memberId" value={memberId} />
    <input type="hidden" name="notificationId" value={notification.id} />
    <button
      class="btn btn-ghost pointer-events-auto absolute right-0 top-0 z-10 h-full w-auto rounded-none p-2 *:text-2xl"
    >
      <span class="i-mdi-delete-outline"></span>
    </button>
  </form>
</div>
