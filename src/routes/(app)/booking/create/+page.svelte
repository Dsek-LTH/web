<script lang="ts">
  import type { PageData } from "./$types";
  import * as m from "$paraglide/messages";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import BookingEditor from "../BookingEditor.svelte";
  import BookingCalendar from "../BookingCalendar.svelte";

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();
</script>

<SetPageTitle title={m.booking_createBooking()} />

<BookingEditor {data} />

<BookingCalendar {...data} class="mt-16" />
