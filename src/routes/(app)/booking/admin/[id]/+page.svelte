<script lang="ts">
  import type { PageData } from "./$types";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import BookingCalendar from "../../BookingCalendar.svelte";
  import BookingEditor from "../../BookingEditor.svelte";
  import * as m from "$paraglide/messages";

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();
</script>

<SetPageTitle title={m.booking_reviewBooking()} />

<BookingEditor {data} mode="review" />

<BookingCalendar {...data} class="mt-16" />
