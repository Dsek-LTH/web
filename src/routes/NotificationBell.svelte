<script lang="ts">
  import Notification from "$lib/components/Notification.svelte";
</script>

<div class="dropdown dropdown-hover">
  <button class="btn btn-ghost *:text-2xl"
    ><span class="i-mdi-bell-outline" /></button
  >
  <ul
    class="menu dropdown-content absolute right-0 w-96 overflow-clip rounded-box bg-base-100 p-0 shadow"
  >
    <li class="pointer-events-none m-0 w-full p-0">
      <Notification
        notificationText={"test"}
        notificationTitle={"Title test"}
        notificationLink={"www.google.com"}
      />
    </li>
    <li class="m-0 w-full p-0">
      <Notification
        notificationText={"longer text longer text longer text longer rtext tea wasdawdasdadawdasdaw yeeeee buddyyyyyyyyyyy"}
        notificationTitle={"Title test 2 longer text buddyyyy light weeeeeeeeeight"}
        notificationLink={"test"}
      />
    </li>
    <button
      class="btn btn-ghost z-10 rounded-none border-0 border-t border-gray-700 *:text-2xl"
    >
      Radera alla <span class="i-mdi-delete-outline" />
    </button>
  </ul>
</div>
