<script lang="ts">
  import type { CartItem as CartItemType } from "$lib/server/shop/getTickets";
  import * as m from "$paraglide/messages";
  import type { SuperValidated } from "sveltekit-superforms";
  import type { PurchaseForm } from "./+page.server";
  import CartItem from "./CartItem/CartItem.svelte";
  import TransactionFee from "./TransactionFee/TransactionFee.svelte";
  import PurchaseSection from "./payments/PurchaseSection.svelte";

  export let inCart: CartItemType[];
  export let transactionFee: number;
  export let totalPrice: number;
  export let purchaseForm: SuperValidated<PurchaseForm>;
</script>

<h1 class="text-2xl">{m.cart()}</h1>

<table class="table mt-4">
  <thead class="hidden md:table-header-group">
    <tr class="border-none">
      <th class="text-left">{m.cart_event()}</th>
      <th class="text-left">{m.cart_ticket()}</th>
      <th class="text-right">{m.cart_price()}</th>
      <th class="text-center">{m.cart_reservation()}</th>
      <th class="text-center">{m.cart_remove()}</th>
    </tr>
  </thead>

  {#each inCart as cartItem (cartItem.id)}
    <CartItem item={cartItem} expiresAt={cartItem.expiresAt} />
  {/each}

  {#if transactionFee > 0}
    <TransactionFee fee={transactionFee} />
  {/if}
  <PurchaseSection {purchaseForm} {totalPrice} showPrice={inCart.length > 1} />
</table>
