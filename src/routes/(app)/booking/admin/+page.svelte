<script lang="ts">
  import dayjs from "dayjs";
  import StatusComponent from "./StatusComponent.svelte";
  import { enhance } from "$app/forms";
  import { getFullName } from "$lib/utils/client/member";
  import MemberAvatar from "$lib/components/socials/MemberAvatar.svelte";
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
        <th>Bokning</th>
        <th>Från</th>
        <th>Till</th>
        <th>Evenemang</th>
        <th>Ansvarig</th>
        <th>Status</th>
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
              <MemberAvatar
                member={bookingRequest.booker}
                class="size-5 flex-shrink-0"
              />
              <a
                href="/members/{bookingRequest.booker.studentId}"
                class="link-hover link"
                >{getFullName(bookingRequest.booker)}
              </a>
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
                GODKÄNN
              </button>
              <button
                formaction="?/reject"
                class="btn btn-xs px-8"
                class:btn-disabled={bookingRequest.status === "DENIED"}
              >
                NEKA
              </button>
            </form>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
