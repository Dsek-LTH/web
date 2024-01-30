<script lang="ts">
  import Notification from "$lib/components/Notification.svelte";
  import type { FocusEventHandler } from "svelte/elements";

  let open = false;

  const handleClick = () => {
    open = !open;
  };

  const handleFocusloss = (
    relatedTarget: FocusEventHandler<HTMLDivElement> | undefined | null,
    currentTarget: any,
  ) => {
    if (currentTarget.contains(relatedTarget)) return;
    open = false;
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
    class="menu dropdown-content right-0 w-72 rounded-box bg-base-100 p-2 shadow"
  >
    <li class="m-0 p-0"><Notification /></li>
    <li class="m-0 p-0"><Notification /></li>
  </ul>
</div>
