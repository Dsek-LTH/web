<script lang="ts">
  import dayjs from "dayjs";
  import StatusComponent from "./StatusComponent.svelte";
  import { enhance } from "$app/forms";
  import { getFullName } from "$lib/utils/client/member";
  import MemberAvatar from "$lib/components/socials/MemberAvatar.svelte";
  import * as m from "$paraglide/messages";
  export let data;
</script>

<a class="btn mb-4" href="/booking">
  <span class="i-mdi-arrow-expand-left" />
  Tillbaka
</a>

<div class="overflow-x-auto">
  <table class="table">
    <thead>
      <tr class="bg-base-200">
        <th>{m.booking_booking()}</th>
        <th>{m.booking_from()}</th>
        <th>{m.booking_until()}</th>
        <th>{m.booking_event()}</th>
        <th>{m.booking_responsible()}</th>
        <th>{m.booking_status()}</th>
        <th />
      </tr>
    </thead>

    <tbody>
      {#each data.bookingRequests as bookingRequest (bookingRequest.id)}
        <tr>
          <td>
            {#each bookingRequest.bookables.map((a) => a.name) as bookable}
              <p class="min-w-max">{bookable}</p>
            {/each}
          </td>
          <td>{dayjs(bookingRequest.start).format("YYYY-MM-DD HH:MM")}</td>
          <td>{dayjs(bookingRequest.end).format("YYYY-MM-DD HH:MM")}</td>
          <td>{bookingRequest.event}</td>
          <td>
            <div class="flex items-center gap-2">
              {#if bookingRequest.booker}
                <MemberAvatar
                  member={bookingRequest.booker}
                  class="size-5 flex-shrink-0"
                />
                <a
                  href="/members/{bookingRequest.booker.studentId}"
                  class="link-hover link"
                  >{getFullName(bookingRequest.booker)}
                </a>
              {/if}
            </div>
          </td>
          <td>
            <StatusComponent
              bind:bookingRequest
              bind:bookingRequests={data.bookingRequests}
            />
          </td>
          <td>
            <form
              method="POST"
              use:enhance
              class="form-control gap-2"
              id={`form-${bookingRequest.id}`}
            >
              <input
                hidden
                name="id"
                type="text"
                bind:value={bookingRequest.id}
              />
              <button
                formaction="?/accept"
                class="btn btn-xs px-8"
                class:btn-disabled={bookingRequest.status === "ACCEPTED"}
              >
                {m.booking_accept()}
              </button>
              <button
                formaction="?/reject"
                class="btn btn-xs px-8"
                class:btn-disabled={bookingRequest.status === "DENIED"}
              >
                {m.booking_deny()}
              </button>
            </form>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
