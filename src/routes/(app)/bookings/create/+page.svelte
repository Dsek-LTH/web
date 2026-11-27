<script lang="ts">
  import type { PageData } from "./$types";
  import BookingsForm from "$lib/bookings/components/BookingsForm.svelte";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import { m } from "$paraglide/messages";

  let { data }: { data: PageData } = $props();
</script>

<SetPageTitle title={m.booking_createBooking()} />

<BookingsForm {data} />
