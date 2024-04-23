<script lang="ts">
  import Price from "$lib/components/Price.svelte";
  import ScrollingNumber from "$lib/components/Timer/ScrollingNumber.svelte";
  import type { CartReservation } from "$lib/server/shop/getTickets";

  export let item: CartReservation;
  $: shoppable = item.shoppable;
  $: event = shoppable.event;
</script>

<li class="flex items-center gap-4">
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
      <div class="font-bold">{shoppable.title}</div>
      <div class="text-sm opacity-50">
        {event.title}
      </div>
      <slot />
    </div>
  </div>

  <Price price={shoppable.price} class="text-lg" />

  <div class="text-2xl font-bold text-primary">
    {#if item.order !== null}
      Köplats <ScrollingNumber number={item.order + 1} />
    {:else}
      Inväntar lotteri
    {/if}
  </div>
</li>
<!-- <tr class="hidden border-none md:table-row">
  <td>
    <CartItemEvent {event} />
  </td>
  <td class="font-medium">
    {shoppable.title}
  </td>
  <td class="text-right">
    <Price price={shoppable.price} />
  </td>
  <td class="text-center">
    <CartItemExpiresAt {expiresAt} />
  </td>
  <td class="text-center">
    <CartItemRemoveButton itemId={item.id} />
  </td>
</tr> -->
