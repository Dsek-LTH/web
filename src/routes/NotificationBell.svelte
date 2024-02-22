<script lang="ts">
  import Notification from "$lib/components/Notification.svelte";
  export let notifications: {
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
  }[];
</script>

<div class="dropdown dropdown-hover flex-wrap">
  <button class="btn btn-ghost *:text-2xl"
    ><span class="i-mdi-bell-outline" /></button
  >
  <ul
    class="menu dropdown-content absolute w-96 flex-wrap overflow-clip rounded-box bg-base-100 p-0 shadow"
  >
    {#if notifications.length < 1}
      {#each notifications as notification (notification.id)}
        <li class="">
          <Notification
            notificationTitle={notification.title}
            notificationText={notification.message}
            notificationLink={notification.link}
          />
        </li>
      {/each}
      <button
        class="btn btn-ghost z-10 rounded-none border-0 border-t border-gray-700 *:text-2xl"
      >
        Radera alla <span class="i-mdi-delete-outline" />
      </button>
    {/if}
    {#if notifications.length >= 1}
      <li class="after:bg-slate-100">
        <p>Ser rätt tomt ut här!</p>
      </li>
    {/if}
    <!-- <li class="pointer-events-none m-0 w-full p-0">
      <Notification
        notificationText={"test"}
        notificationTitle={"Title test"}
        notificationLink={"events/qwerty-1"}
      />
    </li>
    <li class="m-0 w-full p-0">
      <Notification
        notificationText={"longer text longer text longer text longer rtext tea wasdawdasdadawdasdaw yeeeee buddyyyyyyyyyyy"}
        notificationTitle={"Title test 2 longer text buddyyyy light weeeeeeeeeight"}
        notificationLink={"events/qwerty-1"}
      />
    </li> -->
  </ul>
</div>
