<script lang="ts">
  import Notification from "$lib/components/Notification.svelte";

  let open = false;

  const handleClick = () => {
    open = true;
  };
</script>

<div
  class="dropdown"
  on:focusout={() => {
    open = false;
  }}
>
  <button class="btn btn-ghost *:text-2xl" on:click={handleClick}
    ><span class="i-mdi-bell-outline" /></button
  >
  <ul
    class="menu dropdown-content right-0 w-96 overflow-clip rounded-box bg-base-100 p-0 shadow"
  >
    <li class="m-0 p-0">
      <Notification
        notificationText={"test"}
        notificationTitle={"Title test"}
        notificationLink={""}
      />
    </li>
    <li class="m-0 p-0">
      <Notification
        notificationText={"longer text longer text longer text longer rtext tea wasdawdasdadawdasdaw yeeeee buddyyyyyyyyyyy"}
        notificationTitle={"Title test 2 longer text buddyyyy light weeeeeeeeeight"}
        notificationLink={""}
      />
    </li>
    <button
      class="btn btn-ghost rounded-none border-0 border-t border-gray-700 *:text-2xl"
    >
      Radera alla <span class="i-mdi-delete-outline" />
    </button>
  </ul>
</div>
