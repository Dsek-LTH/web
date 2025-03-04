<script lang="ts">
  import dayjs from "dayjs";
  import dbayGIF from "./dbay.gif";
  import { goto } from "$lib/utils/redirect";

  export let item;
</script>

<button
  on:click={() => goto("dbay/" + item.slug)}
  class="flex h-40 rounded-lg bg-base-200 p-2 text-left"
>
  <img
    src={dbayGIF}
    alt="blocket"
    class="mr-2 h-full rounded-md bg-base-300 object-contain"
  />
  <div class="flex flex-col">
    <h3 class="w-full text-2xl font-bold">{item.header}</h3>
    <p class="line-clamp-3">{item.body}</p>
    <p class="text-primary">{item.price} kr</p>
  </div>
  <div class="flex flex-1 flex-col items-end justify-between">
    <p class="text-nowrap text-right text-neutral-600">
      {#if dayjs(item.createdAt).diff(dayjs(), "week") < -1}
        {dayjs(item.createdAt).format("YYYY-MM-DD")}
      {:else}
        {dayjs(item.createdAt).fromNow()}
      {/if}
    </p>
    <div>
      {#if item.email}
        <div class="btn btn-square bg-base-300">
          <span class="i-mdi-email size-6 bg-neutral-600" />
        </div>
      {/if}
      {#if item.phone}
        <div class="btn btn-square bg-base-300">
          <span class="i-mdi-phone size-6 bg-neutral-600" />
        </div>
      {/if}
    </div>
  </div>
</button>
