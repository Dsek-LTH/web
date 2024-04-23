<script lang="ts">
  import type { CartItem as CartItemType } from "$lib/server/shop/getTickets";
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

<h1 class="text-2xl">Kundvagn</h1>

<table class="table mt-4">
  <thead class="hidden md:table-header-group">
    <tr class="border-none">
      <th class="text-left">Event</th>
      <th class="text-left">Biljett</th>
      <th class="text-right">Pris</th>
      <th class="text-center">Reserveration</th>
      <th class="text-center">Ta bort</th>
    </tr>
  </thead>

  {#each inCart as cartItem (cartItem.id)}
    <CartItem item={cartItem} expiresAt={cartItem.expiresAt} />
  {/each}

  {#if transactionFee > 0}
    <TransactionFee fee={transactionFee} />
  {/if}
  <PurchaseSection {purchaseForm} {totalPrice} />
</table>
