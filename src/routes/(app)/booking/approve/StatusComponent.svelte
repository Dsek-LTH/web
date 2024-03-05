<script lang="ts">
  import { enhance } from "$app/forms";
  import type { BookingRequest } from "@prisma/client";

  export let bookingRequest: BookingRequest;
  let status = bookingRequest.status;
</script>

<div>
  {#if status === "PENDING"}
    <form method="POST" use:enhance>
      <input hidden name="id" type="text" value={bookingRequest.id} />
      <button formaction="?/accept" class="btn w-20 bg-green-800">
        ACCEPT
      </button>
      <button formaction="?/reject" class="btn w-20 bg-red-800">
        REJECT
      </button>
    </form>
  {:else if status === "APPROVED"}
    <div class="alert alert-success" role="alert">Approved</div>
  {:else if status === "REJECTED"}
    <div class="alert-danger alert" role="alert">Rejected</div>
  {:else}
    <div class="alert-secondary alert" role="alert">Unknown</div>
  {/if}
</div>
