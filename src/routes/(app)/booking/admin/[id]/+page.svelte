<script lang="ts">
  import type { PageData } from "./$types";
  import { isAuthorized } from "$lib/utils/authorization";
  import apiNames from "$lib/utils/apiNames";
  import { page } from "$app/stores";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import BookingInspector from "../BookingInspector.svelte";
  import BookingCalendar from "../../BookingCalendar.svelte";

  export let data: PageData;
  const isAdmin = isAuthorized(apiNames.BOOKINGS.UPDATE, $page.data.user);
</script>

<SetPageTitle title="Booking Admin Test" />

{#if !isAdmin}
  <div role="alert" class="alert alert-warning mx-auto mb-8 max-w-5xl">
    <span class="i-mdi-warning" />
    <span>{"Warning Test"}</span>
  </div>
{/if}

<BookingInspector {data} />

<BookingCalendar {...data} class="mt-16" />
