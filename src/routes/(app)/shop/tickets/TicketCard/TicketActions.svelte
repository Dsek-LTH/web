<script lang="ts">
  import type { TicketWithMoreInfo } from "$lib/server/shop/getTickets";
  import type { SuperValidated } from "sveltekit-superforms";
  import { superForm } from "sveltekit-superforms/client";
  import type { AddToCartSchema } from "../+page.server";
  import BuyButton from "$lib/components/BuyButton.svelte";

  export let ticket: TicketWithMoreInfo;
  export let addToCartForm: SuperValidated<AddToCartSchema>;
  const { enhance, submitting } = superForm(addToCartForm, {
    id: ticket.id,
  });
</script>

<form method="POST" action="?/addToCart" use:enhance class="self-end">
  <input type="hidden" name="ticketId" value={ticket.id} />
  <BuyButton {ticket} isSubmitting={$submitting} />
</form>
