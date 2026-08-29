<script lang="ts">
  import * as Alert from "$lib/components/ui/alert/index.js";
  import { TriangleAlertIcon } from "@lucide/svelte";
  import * as m from "$paraglide/messages";
  import BookingsForm from "$lib/bookings/components/BookingsForm.svelte";
  import type { PageData } from "./$types.js";

  let { data }: { data: PageData } = $props();

  const isPending = $derived(data.booking.status === "PENDING");
</script>

<div class="layout-container mt-6 w-3/5">
  {#if !(data.isAdmin || isPending)}
    <Alert.Root variant="warning" class="mb-8">
      <TriangleAlertIcon />
      <Alert.Description>{m.booking_editBookingWarning()}</Alert.Description>
    </Alert.Root>
  {/if}
</div>

<BookingsForm {data} mode="edit" />
