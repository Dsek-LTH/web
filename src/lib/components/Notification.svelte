<script lang="ts">
  export let notificationTitle: string;
  export let notificationText: string;
  export let notificationLink: string;

  const handleDelete = () => {
    console.log("Deleting notification");
  };

  const handleClick = () => {
    console.log("Clicking on notification");
  };
</script>

<div class="relative m-0 rounded-none">
  <a
    href={notificationLink}
    class="h-18 pointer-events-auto flex w-80 max-w-80 flex-col justify-center"
    on:click={handleClick}
  >
    <span class="my-1 w-4/5 truncate text-lg font-bold"
      >{notificationTitle}</span
    >
    <span class="w-4/5 truncate text-wrap text-xs">{notificationText}</span>
  </a>
  <button
    class="btn btn-ghost pointer-events-auto absolute right-0 z-10 h-full w-auto rounded-none p-2 *:text-2xl"
    on:click={handleDelete}
  >
    <span class="i-mdi-delete-outline"></span>
  </button>
</div>
