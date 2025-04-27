<script lang="ts">
  import { enhance } from "$app/forms";
  import BuyButton from "$lib/components/BuyButton.svelte";
  import type { TicketWithMoreInfo } from "$lib/server/shop/getTickets";

  interface Props {
    ticket: TicketWithMoreInfo;
  }

  let { ticket }: Props = $props();
  let isSubmitting = $state(false);
</script>

<form
  method="POST"
  action="?/addToCart"
  use:enhance={() => {
    isSubmitting = true;
    return ({ update }) => {
      update();
      isSubmitting = false;
    };
  }}
  class="card-actions justify-end"
>
  <input type="hidden" name="ticketId" value={ticket.id} />
  <BuyButton {ticket} {isSubmitting} />
</form>
