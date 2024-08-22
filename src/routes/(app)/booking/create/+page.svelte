<script lang="ts">
  import type { PageData } from "./$types";
  import * as m from "$paraglide/messages";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import BookingEditor from "../BookingEditor.svelte";
  export let data: PageData;
</script>

<SetPageTitle title={m.booking_createBooking()} />

<BookingEditor {data} />
