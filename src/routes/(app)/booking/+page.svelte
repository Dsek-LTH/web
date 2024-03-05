<script lang="ts">
  import BookableSelector from "./BookableSelector.svelte";
  import Calendar from "./Calendar.svelte";

  import type { PageData } from "./$types";
  import { enhance } from "$app/forms";
  import type { Bookable } from "@prisma/client";
  export let data: PageData;
  let selectedBookables: Bookable[] = [];
</script>

<div>
  <form method="POST" use:enhance class="join">
    <BookableSelector allBookables={data.bookables} bind:selectedBookables />
    <input
      type="text"
      name="bookables"
      hidden
      value={selectedBookables.map((a) => a.id)}
    />
    <input
      type="text"
      name="start"
      placeholder="Start"
      class="input input-bordered w-full max-w-xs"
    />
    <input
      type="text"
      name="end"
      placeholder="End"
      class="input input-bordered w-full max-w-xs"
    />
    <input
      type="text"
      name="event"
      placeholder="Event"
      class="input input-bordered w-full max-w-xs"
    />
    <button class="btn btn-primary">Create</button>
  </form>
</div>

<Calendar bookingRequests={data.bookingRequests} />
