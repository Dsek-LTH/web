<script lang="ts">
  import { enhance } from "$app/forms";
  import Timer from "$lib/components/Timer/Timer.svelte";
  import type { CartItem } from "$lib/server/shop/getTickets";
  import { now } from "$lib/stores/date";
  import dayjs from "dayjs";

  export let item: CartItem;
  export let expiresAt: Date | null = null;
  $: shoppable = item.shoppable;
  $: event = shoppable.event;
</script>

<tr>
  <td>
    <div class="flex items-center gap-3">
      <div class="avatar">
        <div class="mask mask-squircle h-12 w-12">
          <img
            src={event.imageUrl ??
              "https://minio.api.dsek.se/news/public/8c97c4c6-d4f4-44f5-9658-cff70110ad85.webp"}
            alt="{event.title} event photo"
          />
        </div>
      </div>
      <div>
        <div class="font-bold">{event.title}</div>
        <div class="text-sm opacity-50">
          {dayjs(event.startDatetime).format("DD/MM")}
        </div>
      </div>
    </div>
  </td>
  <td class="font-medium">
    {shoppable.title}
  </td>
  <td class="font-semibold text-success">{shoppable.price / 100} SEK</td>
  <td class="text-center">
    {#if expiresAt}
      <div class="badge badge-primary">
        <Timer
          milliseconds={expiresAt.valueOf() - $now.valueOf()}
          class="w-[5ch] justify-center"
        />
      </div>
    {:else}
      <span>Obegränsad</span>
    {/if}
  </td>
  <th class="text-center">
    <form method="POST" action="?/removeItem" use:enhance>
      <input type="hidden" name="id" value={item.id} />
      <button type="submit" class="btn btn-ghost">
        <span class="i-mdi-trash-can text-xl" />
      </button>
    </form>
  </th>
</tr>
