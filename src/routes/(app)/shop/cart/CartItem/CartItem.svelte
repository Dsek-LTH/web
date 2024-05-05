<script lang="ts">
  import type { CartItem } from "$lib/server/shop/getTickets";
  import CartItemEvent from "./CartItemEvent.svelte";
  import CartItemExpiresAt from "./CartItemExpiresAt.svelte";
  import CartItemRemoveButton from "./CartItemRemoveButton.svelte";
  import Price from "$lib/components/Price.svelte";

  export let item: CartItem;
  export let expiresAt: Date | null = null;
  $: shoppable = item.shoppable;
  $: event = shoppable.event;
</script>

<tr class="hidden border-none md:table-row">
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
</tr>

<tr class="border-none md:hidden">
  <td colspan="2">
    <CartItemEvent {event} />
  </td>
  <td>
    <CartItemRemoveButton itemId={item.id} />
  </td>
</tr>
<tr class="border-none md:hidden">
  <td class="font-medium">{shoppable.title} </td>
  <td>
    <CartItemExpiresAt {expiresAt} />
  </td>
  <td class="text-right">
    <Price price={shoppable.price} />
  </td>
</tr>
