<script lang="ts">
  import type { PageData } from "./$types";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import BookingInspector from "../BookingInspector.svelte";
  import BookingCalendar from "../../BookingCalendar.svelte";

  export let data: PageData;
</script>

<SetPageTitle title="Booking Admin Test" />

<BookingInspector {data} />

<BookingCalendar {...data} class="mt-16" />
