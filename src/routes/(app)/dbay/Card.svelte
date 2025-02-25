<script lang="ts">
  import dayjs from "dayjs";
  import dbayGIF from "./dbay.gif";

  export let item;
</script>

<div class="flex h-40 rounded-lg bg-base-200 p-2">
  <img
    src={dbayGIF}
    alt="blocket"
    class="mr-2 h-full rounded-md bg-base-300 object-contain"
  />
  <div class="flex flex-col">
    <h3 class="w-full text-2xl">{item.header}</h3>
    <p class="line-clamp-3">{item.body}</p>
    <p class="text-primary">{item.price} kr</p>
  </div>
  <p class="flex-1 text-nowrap text-right text-neutral-600">
    {#if dayjs(item.createdAt).diff(dayjs(), "week") < -1}
      {dayjs(item.createdAt).format("YYYY-MM-DD")}
    {:else}
      {dayjs(item.createdAt).fromNow()}
    {/if}
  </p>
</div>
