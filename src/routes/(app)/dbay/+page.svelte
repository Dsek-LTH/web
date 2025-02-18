<script lang="ts">
  import dayjs from "dayjs";
  export let data;

  const { dbay } = data;
</script>

<div class="layout-container">
  <div class="mb-4">
    <a class="btn btn-primary" href="/dbay/create">+ Post</a>
  </div>
  <main class="flex flex-col">
    {#each dbay as item, index}
      <div class="flex h-40 rounded-lg bg-base-200 p-2">
        <img
          src="https://cdn.discordapp.com/attachments/1042801676177915965/1341492695293628436/3dgifmaker70738.gif?ex=67b631ee&is=67b4e06e&hm=74f9534a7915b2a01b965f78281d5f5f4b10c035da1312acafba4a0af3931511&"
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
      {#if index != dbay.length - 1}
        <div class="divider" />
      {/if}
    {/each}
  </main>
</div>
