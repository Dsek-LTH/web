<script lang="ts">
  import type {
    CartItem as CartItemType,
    PurchaseForm,
  } from "$lib/utils/shop/types";
  import * as m from "$paraglide/messages";
  import type { SuperForm } from "sveltekit-superforms";
  import CartItem from "./CartItem/CartItem.svelte";
  import PurchaseSection from "./Payments/PurchaseSection.svelte";
  import CartQuestionsModal from "./Questions/CartQuestionsModal.svelte";
  import TransactionFee from "./TransactionFee/TransactionFee.svelte";

  export let inCart: CartItemType[];
  export let transactionFee: number;
  export let totalPrice: number;
  export let superform: SuperForm<PurchaseForm>;

  $: questionsArePresent = inCart.some(
    (item) => item.shoppable.questions.length > 0,
  );
  let currentlyInspectedItem: number | null = null;
</script>

<h1 class="text-2xl">{m.cart()}</h1>

<table class="table mt-4">
  <thead class="hidden md:table-header-group">
    <tr class="border-none">
      <th class="text-left">{m.cart_event()}</th>
      <th class="text-left">{m.cart_ticket()}</th>
      <th class="text-right">{m.cart_price()}</th>
      {#if questionsArePresent}
        <th class="text-left">Detaljer</th>
      {/if}
      <th class="text-center">{m.cart_reservation()}</th>
      <th class="text-center">{m.cart_remove()}</th>
    </tr>
  </thead>

  {#each inCart as cartItem, index (cartItem.id)}
    <CartItem
      item={cartItem}
      expiresAt={cartItem.expiresAt}
      showQuestionsColumn={questionsArePresent}
      showQuestions={() => {
        currentlyInspectedItem = index;
      }}
    />
  {/each}

  {#if transactionFee > 0}
    <TransactionFee fee={transactionFee} />
  {/if}
  <PurchaseSection {superform} {totalPrice} showPrice={inCart.length > 1} />
</table>

<CartQuestionsModal
  allQuestions={inCart.flatMap((item) => item.shoppable.questions)}
  inspectedItem={currentlyInspectedItem !== null
    ? inCart[currentlyInspectedItem]
    : null}
  onClose={() => {
    currentlyInspectedItem = null;
  }}
/>
