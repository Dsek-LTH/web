<script lang="ts">
  import Price from "$lib/components/Price.svelte";
  import ExpiresAtTimer from "$lib/components/shop/cart/ExpiresAtTimer.svelte";
  import type { CartItem } from "$lib/utils/shop/types";
  import CartItemEvent from "./CartItemEvent.svelte";
  import CartItemRemoveButton from "./CartItemRemoveButton.svelte";

  interface Props {
    item: CartItem;
    expiresAt?: Date | null;
    showQuestionsColumn: boolean;
    showQuestions: () => void;
  }

  let {
    item,
    expiresAt = null,
    showQuestionsColumn,
    showQuestions,
  }: Props = $props();
  let shoppable = $derived(item.shoppable);
  let event = $derived(shoppable.event);
  let unansweredQuestions = $derived(
    shoppable.questions.filter(
      (q) => !item.questionResponses.some((r) => r.questionId === q.id),
    ),
  );
  let totalPrice = $derived(
    item.shoppable.price +
      item.questionResponses.reduce(
        (acc, response) => acc + (response.extraPrice ?? 0),
        0,
      ),
  );
</script>

<tr class="hidden border-none md:table-row">
  <td>
    <CartItemEvent {event} />
  </td>
  <td class="font-medium">
    {shoppable.title}
  </td>
  <td class="text-right">
    <Price price={totalPrice} />
  </td>
  {#if showQuestionsColumn}
    <td class="text-left">
      {#if shoppable.questions.length > 0}
        <button class="btn btn-outline btn-sm" onclick={showQuestions}>
          {#if unansweredQuestions.length > 0}Svara på frågor
          {:else}
            Visa svar
          {/if}
        </button>
      {:else}
        <span>-</span>
      {/if}
    </td>
  {/if}
  <td class="text-center">
    <ExpiresAtTimer {expiresAt} />
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
    <ExpiresAtTimer {expiresAt} />
  </td>
  <td class="text-right">
    <Price price={totalPrice} />
  </td>
</tr>

{#if shoppable.questions.length > 0}
  <tr class="border-none md:hidden">
    <td colspan="3" class="text-left">
      <button class="btn btn-outline btn-sm" onclick={showQuestions}>
        {#if unansweredQuestions.length > 0}Svara på frågor
        {:else}
          Visa svar
        {/if}
      </button>
    </td>
  </tr>
{/if}
