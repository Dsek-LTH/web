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

<div class="relative rounded-none">
  <a
    href={notificationLink}
    class="flex h-12 max-w-full flex-col"
    on:click={handleClick}
  >
    <span class="truncate text-lg">{notificationTitle}</span>
    <span class=" truncate text-xs">{notificationText}</span>
  </a>
  <button
    class="btn btn-ghost absolute right-0 h-full w-auto rounded-none p-2 *:text-2xl"
    on:click={handleDelete}
  >
    <span class="i-mdi-delete-outline"></span>
  </button>
</div>
