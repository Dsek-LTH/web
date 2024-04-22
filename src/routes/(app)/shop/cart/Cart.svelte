<script lang="ts">
  import type { CartItem as CartItemType } from "$lib/server/shop/getTickets";
  import type { SuperValidated } from "sveltekit-superforms";
  import type { PurchaseForm } from "./+page.server";
  import PurchaseSection from "./PurchaseSection.svelte";
  import TransactionFee from "./TransactionFee.svelte";
  import CartItem from "./CartItem.svelte";

  export let inCart: CartItemType[];
  export let transactionFee: number;
  export let totalPrice: number;
  export let purchaseForm: SuperValidated<PurchaseForm>;
</script>

<table class="table">
  <!-- head -->
  <thead>
    <tr>
      <th>Event</th>
      <th>Biljett</th>
      <th>Pris</th>
      <th class="text-center">Reserverad i</th>
      <th class="text-center">Ta bort</th>
    </tr>
  </thead>
  {#each inCart as cartItem (cartItem.id)}
    <CartItem item={cartItem} expiresAt={cartItem.expiresAt} />
  {/each}
  {#if transactionFee > 0}
    <TransactionFee fee={transactionFee} />
  {/if}
</table>
<PurchaseSection {purchaseForm} {totalPrice} />
